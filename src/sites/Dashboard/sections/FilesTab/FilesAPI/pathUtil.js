// Organizes flat file list into folder structure
export function buildFileTree(files) {
    const root = {
      id: 'root',
      name: 'Root',
      type: 'folder',
      children: [],
      files: []
    };
  
    files.forEach(file => {
      // Skip if no path (root level files)
      const pathParts = file.path ? file.path.split('/') : [];
      
      let currentLevel = root;
      
      // Create folder structure
      pathParts.forEach(folderName => {
        let folder = currentLevel.children.find(f => f.name === folderName);
        if (!folder) {
          folder = {
            id: `folder-${pathParts.join('-')}-${folderName}`,
            name: folderName,
            type: 'folder',
            children: [],
            files: []
          };
          currentLevel.children.push(folder);
        }
        currentLevel = folder;
      });
      
      // Add file to current level
      currentLevel.files.push({
        ...file,
        type: 'file'
      });
    });
  
    return root;
  }
  
  // Flattens the tree back for table display when a folder is clicked
  export function flattenFolderContents(folder) {
    const files = [];
    
    function collectFiles(node) {
      files.push(...node.files);
      node.children.forEach(collectFiles);
    }
    
    collectFiles(folder);
    return files;
  }