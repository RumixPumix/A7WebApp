const profiles = [
    { id: '1', name: 'John Doe', userId: 'user1', role: 'admin', isOnline: true, description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { id: '2', name: 'Jane Smith', userId: 'user2', role: 'user', isOnline: false },
    { id: '3', name: 'Alice Johnson', userId: 'user3', role: 'Moderator', isOnline: true },
    { id: '4', name: 'Bob Brown', userId: 'user4', role: 'user', isOnline: false },
    { id: '5', name: 'Charlie Black', userId: 'user5', role: 'admin', isOnline: true },
    { id: '6', name: 'Diana Prince', userId: 'user6', role: 'user', isOnline: false },
    { id: '7', name: 'Ethan Hunt', userId: 'user7', role: 'Moderator', isOnline: true },
    { id: '8', name: 'Felicity Smoak', userId: 'user8', role: 'user', isOnline: false },
];

function fetchProfile(profileId) {
  return new Promise((resolve, reject) => {
    const profile = profiles.find((profile) => profile.id === profileId);
    if (profile) {
      resolve(profile);
    } else {
      reject(new Error('Profile not found'));
    }
  });
}

export default fetchProfile;