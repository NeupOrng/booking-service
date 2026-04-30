declare const _default: () => {
    jwt: {
        privateKey: string;
        publicKey: string;
        accessExpiry: string;
    };
    oauth: {
        google: {
            clientID: string;
            clientSecret: string;
            callbackURL: string;
        };
    };
    storage: {
        url: string;
        serviceRoleKey: string;
        bucket: string;
        presignExpirySeconds: number;
    };
};
export default _default;
