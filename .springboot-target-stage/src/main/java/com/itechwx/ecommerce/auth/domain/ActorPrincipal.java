package com.itechwx.ecommerce.auth.domain;

import java.security.Principal;
import java.util.Set;

public sealed interface ActorPrincipal extends Principal
        permits UserPrincipal, ShopPrincipal, AdminPrincipal {

    String accountId();

    String deviceId();

    String email();

    ActorType actorType();

    Set<String> permissions();

    @Override
    default String getName() {
        return accountId();
    }
}
