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
    kratos: {
        publicUrl: string;
        adminUrl: string;
    };
    hydra: {
        adminUrl: string;
        publicUrl: string;
    };
};
export default _default;
