function fetchProfiles() {
    return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'John Doe', userId: 'user1', role: 'admin', isOnline: true },
        { id: '2', name: 'Jane Smith', userId: 'user2', role: 'user', isOnline: false },
        { id: '3', name: 'Alice Johnson', userId: 'user3', role: 'Moderator', isOnline: true },
        { id: '4', name: 'Bob Brown', userId: 'user4', role: 'user', isOnline: false },
        { id: '5', name: 'Charlie Black', userId: 'user5', role: 'admin', isOnline: true },
        { id: '6', name: 'Diana Prince', userId: 'user6', role: 'user', isOnline: false },
        { id: '7', name: 'Ethan Hunt', userId: 'user7', role: 'Moderator', isOnline: true },
        { id: '8', name: 'Felicity Smoak', userId: 'user8', role: 'user', isOnline: false },
      ]);
    }, 1000);
  });
}

export default fetchProfiles;