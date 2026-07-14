package com.itechwx.ecommerce.auth.application;

import java.util.Optional;

public interface LegacySessionReader {

    Optional<LegacySessionSnapshot> findActive(
            String accountId,
            String deviceId,
            String presentedToken
    );
}
