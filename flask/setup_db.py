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
from app.models.role import Role
from app.models.permission import Permission
from dotenv import load_dotenv
from app import create_app
import json

# Load environment variables
load_dotenv()

def create_json_files():
    """Create JSON files for permissions and roles"""
    permissions_data = {
        "permissions": [
            {"name": "admin.route.get.users", "description": "Get all users"},
            {"name": "admin.route.delete.user", "description": "Delete a user"},
            {"name": "admin.route.create.user", "description": "Create a new user"},
            {"name": "admin.route.update.user", "description": "Update user information"},
            {"name": "admin.route.get.tokens", "description": "Get all registration tokens"},
            {"name": "admin.route.create.token", "description": "Create a new registration token"},
            {"name": "admin.route.delete.token", "description": "Delete a registration token"},
            {"name": "admin.route.ban.user", "description": "Ban a user"},
            {"name": "admin.route.unban.user", "description": "Unban a user"},
            {"name": "admin.route.unban.user.limited", "description": "Unban a user that only that user banned"},
            {"name": "file.route.get.files", "description": "Get all files even private ones"},
            {"name": "file.route.get.files.limited", "description": "Get files only that are publicly available"},
            {"name": "file.route.get.private.files", "description": "Get your private files"},
            {"name": "file.route.upload.file", "description": "Upload a file with no restrictions"},
            {"name": "file.route.upload.file.limited", "description": "Upload a file with restrictions"},
            {"name": "file.route.upload.private.file", "description": "Upload a private file"},
            {"name": "file.route.upload.private.file.limited", "description": "Upload a private file"},
            {"name": "file.route.download.file", "description": "Download a file"},
            {"name": "file.route.download.file.limited", "description": "Download a file only that are publicly available"},
            {"name": "file.route.delete.file.limited", "description": "Delete a file only that user uploaded"},
            {"name": "file.route.delete.file", "description": "Delete any file"},
            {"name": "file.route.update.file", "description": "Update file information"},
            {"name": "file.route.update.file.limited", "description": "Update file information only that user uploaded"},
        ]
    }

    with open('permissions.json', 'w') as f:
        json.dump(permissions_data, f, indent=4)

    roles_data = {
        "roles": [
            {"name": "Admin", "description": "Administrator role with all permissions", "permissions": [
                "admin.route.get.users", "admin.route.delete.user", "admin.route.create.user",
                "admin.route.update.user", "admin.route.get.tokens", "admin.route.create.token",
                "admin.route.delete.token", "admin.route.ban.user", "admin.route.unban.user", 
                "file.route.get.files", "file.route.upload.file", "file.route.download.file",
                "file.route.delete.file", "file.route.update.file"
            ]},
            {"name": "Moderator", "description": "Moderator role with limited permissions", "permissions": [
                "admin.route.get.users", "admin.route.ban.user", "admin.route.get.tokens", "admin.route.create.token",
                "admin.route.unban.user.limited"
            ]},
            {"name": "Uploader", "description": "User with unlimited uploads", "permissions": [
                "file.route.upload.file"
            ]},
            {"name": "User", "description": "Regular user role with limited permissions", "permissions": [
                "file.route.get.files.limited", "file.route.upload.file.limited", "file.route.download.file.limited",
                "file.route.delete.file.limited", "file.route.update.file.limited"
            ]},
        ]
    }

    with open('roles.json', 'w') as f:
        json.dump(roles_data, f, indent=4)

def permissions_and_roles(app):
    # Load permissions
    try:
        
        with app.app_context():
            with open('permissions.json', 'r') as f:
                permissions_data = json.load(f)
                for permission in permissions_data['permissions']:
                    permission_obj = Permission.query.filter_by(name=permission['name']).first()
                    if not permission_obj:
                        permission_obj = Permission(name=permission['name'], description=permission['description'])
                        db.session.add(permission_obj)
            db.session.commit()
    except FileNotFoundError:
        print("permissions.json file not found. Skipping permissions setup.")
        return
    except json.JSONDecodeError:
        print("Error decoding JSON from permissions.json. Skipping permissions setup.")
        return
    except Exception as e:
        print(f"An unexpected error occurred while processing permissions: {e}")
        return

    # Load roles and assign permissions
    try:
        with app.app_context():
            with open('roles.json', 'r') as f:
                roles_data = json.load(f)
                for role in roles_data['roles']:
                    role_obj = Role.query.filter_by(name=role['name']).first()
                    if not role_obj:
                        role_obj = Role(name=role['name'], description=role['description'])
                    # Clear existing permissions to avoid duplication or conflicts
                    role_obj.permissions = []

                    for perm_name in role['permissions']:
                        perm_obj = Permission.query.filter_by(name=perm_name).first()
                        if perm_obj:
                            role_obj.permissions.append(perm_obj)
                        else:
                            print(f"Warning: Permission '{perm_name}' not found in DB, skipping.")

                    db.session.add(role_obj)
            db.session.commit()
    except FileNotFoundError:
        print("roles.json file not found. Skipping roles setup.")
    except json.JSONDecodeError:
        print("Error decoding JSON from roles.json. Skipping roles setup.")
    except Exception as e:
        print(f"An unexpected error occurred while processing roles: {e}")


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

def generate_default_users(app):
    with app.app_context():
        roles = Role.query.all()
        if not roles:
            print("No roles found. Please ensure roles are set up before creating users.")
            return       
        if not User.query.filter_by(username="admin").first():
                admin_user = User(username="admin")
                admin_user.set_password("1234")
                admin_user.set_role("Admin")
                db.session.add(admin_user)
        if not User.query.filter_by(username="user").first():
                regular_user = User(username="user")
                regular_user.set_role("User")
                regular_user.set_password("1234")
                db.session.add(regular_user)
        db.session.commit()

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
            generate_default_users()
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
        # Permissions and roles setup
        create_json_files()
        permissions_and_roles(app)
        #Check for default accounts
        generate_default_users(app)

if __name__ == '__main__':
    setup_database()
