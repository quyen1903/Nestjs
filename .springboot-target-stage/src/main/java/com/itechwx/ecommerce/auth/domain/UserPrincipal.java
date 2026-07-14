package com.itechwx.ecommerce.auth.domain;

import java.util.Objects;
import java.util.Set;

public record UserPrincipal(
        String accountId,
        String deviceId,
        String email,
        Set<String> permissions
) implements ActorPrincipal {

    public UserPrincipal {
        accountId = Objects.requireNonNull(accountId);
        deviceId = Objects.requireNonNull(deviceId);
        email = Objects.requireNonNull(email);
        permissions = Set.copyOf(permissions);
    }

    @Override
    public ActorType actorType() {
        return ActorType.USER;
    }
}
