import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";
import { ForbiddenError } from "../libs/errors.js";
import type { UserRole } from "../modules/users/user.types.js";

/**
 * Middleware to require verified email
 * Use after authGuard - checks if the authenticated user has verified their email
 *
 * Usage:
 *   { preHandler: [authGuard, requireVerifiedEmail] }
 */
export async function requireVerifiedEmail(
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> {
    if (!request.user) {
        return; // authGuard should have already thrown
    }

    if (!request.user.emailVerified) {
        throw new ForbiddenError(
            "Please verify your email address to access this resource",
            "EMAIL_NOT_VERIFIED"
        );
    }
}

/**
 * Factory function for requiring verified email with custom options
 *
 * Usage:
 *   { preHandler: [authGuard, requireVerifiedEmailOr({ allowRoles: ["ADMIN"] })] }
 */
export function requireVerifiedEmailOr(options: {
    allowRoles?: UserRole[];
}): preHandlerHookHandler {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        if (!request.user) {
            return;
        }

        // Allow certain roles to bypass email verification
        if (options.allowRoles?.some(role => request.user!.roles.includes(role))) {
            return;
        }

        if (!request.user.emailVerified) {
            throw new ForbiddenError(
                "Please verify your email address to access this resource",
                "EMAIL_NOT_VERIFIED"
            );
        }
    };
}
