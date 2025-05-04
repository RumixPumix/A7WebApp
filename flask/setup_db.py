import os
from sqlalchemy import create_engine, text, inspect, Table, MetaData
from app import db
from app.models.user import User
from app.models.forum import ForumComment, ForumPost, post_likes, post_dislikes
from app.models.token import RegistrationToken
from app.models.file import File
from app.models.server import Server
from app.models.plugin import Plugin
from app.models.serverplugin import ServerPlugin
from dotenv import load_dotenv
from app import create_app

# Load environment variables
load_dotenv()

def check_and_create_database(engine, db_name):
    """Check if database exists, create if it doesn't"""
    with engine.connect() as conn:
        result = conn.execute(text("SHOW DATABASES LIKE :name"), {'name': db_name})
        if result.fetchone() is None:
            print(f"Database '{db_name}' does not exist. Creating...")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            conn.execute(text(f"USE {db_name}"))
            return True
        else:
            print(f"Database '{db_name}' already exists.")
            return False

def check_table_structure(inspector, table):
    """Verify if table exists and has all required columns"""
    if isinstance(table, Table):
        table_name = table.name
        columns = {column.name for column in table.columns}
    else:
        table_name = table.__tablename__
        columns = {column.name for column in table.__table__.columns}
    
    if table_name not in inspector.get_table_names():
        print(f"Table '{table_name}' does not exist.")
        return False

    existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
    
    if not columns.issubset(existing_columns):
        missing_columns = columns - existing_columns
        print(f"Table '{table_name}' is missing columns: {missing_columns}")
        return False

    return True

def build_dependency_graph(inspector):
    """Builds a dependency graph between tables based on foreign keys"""
    graph = {}
    for table_name in inspector.get_table_names():
        graph[table_name] = set()
        for fk in inspector.get_foreign_keys(table_name):
            referred = fk.get('referred_table')
            if referred:
                graph[table_name].add(referred)
    return graph

def topological_sort(graph):
    """Sort tables so that dependent tables come first"""
    visited = set()
    order = []

    def visit(node):
        if node not in visited:
            visited.add(node)
            for neighbor in graph.get(node, []):
                visit(neighbor)
            order.append(node)

    for node in graph:
        visit(node)

    return order

def drop_and_recreate_tables(tables_to_recreate):
    """Drops and recreates tables in dependency-safe order"""
    inspector = inspect(db.engine)

    # Build dependency graph
    graph = build_dependency_graph(inspector)

    # Sort tables: dependent tables first
    sorted_tables = topological_sort(graph)

    # Only keep tables that we actually need to recreate
    tables_needed = [t for t in sorted_tables if t in tables_to_recreate]

    print(f"Tables will be dropped in order: {tables_needed}")

    with db.engine.begin() as conn:
        # Disable foreign key checks
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))

        # Drop tables manually with raw SQL
        for table_name in tables_needed:
            print(f"Dropping table '{table_name}'...")
            conn.execute(text(f"DROP TABLE IF EXISTS `{table_name}`"))

        # Re-enable foreign key checks
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

    # Now recreate tables normally
    for mapper in db.Model.registry.mappers:
        model = mapper.class_
        if model.__table__.name in tables_to_recreate:
            print(f"Recreating table '{model.__table__.name}'...")
            model.__table__.create(db.engine)

def setup_database():
    db_url = os.getenv('DATABASE_URL')  # mysql+pymysql://root:1203@localhost/
    db_name = os.getenv('DB_NAME')      # A7FlaskDB

    engine = create_engine(db_url)
    is_new_db = check_and_create_database(engine, db_name)

    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = f"{db_url}{db_name}"

    with app.app_context():
        inspector = inspect(db.engine)

        models = [User, ForumComment, ForumPost, RegistrationToken, File, Server, Plugin, ServerPlugin]
        association_tables = [post_likes, post_dislikes]

        all_tables = models + association_tables

        tables_to_recreate = []

        if is_new_db:
            print("Creating tables (new database)...")
            db.create_all()
            print("Tables created successfully.")
            # Insert default users
            admin_user = User(username="admin", is_admin=True)
            admin_user.set_password("1234")

            regular_user = User(username="user", is_admin=False)
            regular_user.set_password("1234")

            db.session.add_all([admin_user, regular_user])
            db.session.commit()

            print("Default users 'admin' and 'user' have been created.")
        else:
            for table in all_tables:
                if not check_table_structure(inspector, table):
                    if isinstance(table, Table):
                        tables_to_recreate.append(table.name)
                    else:
                        tables_to_recreate.append(table.__tablename__)

            if tables_to_recreate:
                print(f"Tables needing recreation: {tables_to_recreate}")
                drop_and_recreate_tables(tables_to_recreate)
            else:
                print("All tables are up-to-date. No changes needed.")

if __name__ == '__main__':
    setup_database()
