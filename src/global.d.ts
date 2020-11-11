interface QuaggaBuildEnvironment {
    development?: boolean;
    node?: boolean;
}

// injected by the build system
declare const ENV: QuaggaBuildEnvironment;
