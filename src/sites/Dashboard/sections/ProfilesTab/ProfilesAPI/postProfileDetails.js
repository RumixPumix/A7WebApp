function postProfileDetails(profileId, profileDetails) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
        if (profileId && profileDetails) {
            resolve({ ...profileDetails, id: profileId });
        } else {
            reject(new Error('Invalid profile details'));
        }
        }, 1000);
    });
}

export default postProfileDetails;