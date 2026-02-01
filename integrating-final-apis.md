# Client-Side API Implementation Plan

> **Project:** AtlasCaucasus Tourism Platform
> **Scope:** Implement missing backend API integrations on the client
> **Total Missing Endpoints:** 18 (excluding optional health endpoints)
> **Estimated Modules to Create/Modify:** 6

---

## Table of Contents

1. [Users Module - Admin Create User](#1-users-module---admin-create-user)
2. [Companies Module - Logo Upload](#2-companies-module---logo-upload)
3. [Chat Module - Group Chat & Management](#3-chat-module---group-chat--management)
4. [Reviews Module - Complete Implementation](#4-reviews-module---complete-implementation)
5. [Media Module - Avatar & Batch Upload](#5-media-module---avatar--batch-upload)
6. [Health Module - Status Page (Optional)](#6-health-module---status-page-optional)

---

## Prerequisites

Before implementing any of these APIs, ensure the following patterns are understood:

```
client/src/
├── features/{module}/
│   ├── services/{module}.service.ts   # API calls using axios
│   ├── hooks/use{Module}.ts           # React Query hooks
│   ├── types/{module}.types.ts        # TypeScript interfaces
│   └── components/                    # UI components
├── lib/
│   ├── api/axios.config.ts            # Axios instance
│   └── constants/api-endpoints.ts     # Endpoint constants
```

**Standard Response Types (already exist in `lib/api/api.types.ts`):**
- `ApiResponse<T>` - Single item response
- `PaginatedApiResponse<T>` - Paginated list response


## 3. Chat Module - Group Chat & Management

### 3.1 Overview

| Property | Value |
|----------|-------|
| **Backend Endpoints** | 3 endpoints |
| **Auth Required** | Yes |
| **Priority** | Medium |
| **UI Required** | Yes - Group chat creation modal, participant management |

**Endpoints to implement:**
1. `POST /api/v1/chats/group` - Create group chat
2. `POST /api/v1/chats/:chatId/participants` - Add participant
3. `DELETE /api/v1/chats/:chatId/leave` - Leave chat

### 3.2 Implementation Steps

#### Step 3.2.1: Update API Endpoints Constants

**File:** `client/src/lib/constants/api-endpoints.ts`

Add to the `CHATS` section:
```typescript
CHATS: {
  // ... existing endpoints
  CREATE_GROUP: '/chats/group',                                    // ADD
  ADD_PARTICIPANT: (chatId: string) => `/chats/${chatId}/participants`,  // ADD
  LEAVE: (chatId: string) => `/chats/${chatId}/leave`,            // ADD
}
```

#### Step 3.2.2: Add Type Definitions

**File:** `client/src/features/chats/types/chat.types.ts`

Add interfaces:
```typescript
export interface CreateGroupChatRequest {
  name: string;
  participantIds: string[];
}

export interface AddParticipantRequest {
  userId: string;
}

export interface GroupChat extends Chat {
  name: string;
  isGroup: true;
  createdBy: string;
}
```

#### Step 3.2.3: Update Chat Service

**File:** `client/src/features/chats/services/chat.service.ts`

Add methods:
```typescript
async createGroupChat(data: CreateGroupChatRequest): Promise<GroupChat> {
  const response = await apiClient.post<ApiResponse<GroupChat>>(
    API_ENDPOINTS.CHATS.CREATE_GROUP,
    data
  );
  return response.data.data;
}

async addParticipant(chatId: string, userId: string): Promise<void> {
  await apiClient.post(
    API_ENDPOINTS.CHATS.ADD_PARTICIPANT(chatId),
    { userId }
  );
}

async leaveChat(chatId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.CHATS.LEAVE(chatId));
}
```

#### Step 3.2.4: Create Hooks

**File:** `client/src/features/chats/hooks/useChats.ts`

Add mutation hooks:
```typescript
export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateGroupChatRequest) => chatService.createGroupChat(data),
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('Group chat created');
      router.push(`/dashboard/chats/${chat.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAddParticipant = (chatId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatService.addParticipant(chatId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      toast.success('Participant added');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useLeaveChat = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (chatId: string) => chatService.leaveChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('You left the chat');
      router.push('/dashboard/chats');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
```

#### Step 3.2.5: UI Components

**Component 1:** `client/src/features/chats/components/CreateGroupChatModal.tsx`
- Group name input
- User search/select for participants (multi-select)
- Minimum 2 participants validation
- Create button with loading state

**Component 2:** `client/src/features/chats/components/ChatParticipantManager.tsx`
- List current participants
- Search and add new participants (if group admin)
- Remove participant button (if group admin)

**Component 3:** `client/src/features/chats/components/LeaveChatButton.tsx`
- Confirmation dialog before leaving
- Handles both direct and group chats

### 3.3 Integration Points

- **Chat List Page:** Add "Create Group" button
- **Chat Detail Page:** Add participant management for groups
- **Chat Header:** Add "Leave Chat" option in menu

### 3.4 Testing Checklist

- [ ] Group chat creation with multiple participants
- [ ] Participant addition works for group admins
- [ ] Leave chat removes user and redirects
- [ ] UI updates after all operations
- [ ] Error handling for all endpoints

---

## Implementation Order Recommendation

Based on dependencies and user impact:

### Phase 1: High Priority (User-Facing Features)
1. **Reviews Module** (Section 4) - Critical for trust and engagement
2. **User Avatar Upload** (Section 5.2) - Profile personalization
3. **Company Logo Upload** (Section 2) - Brand identity

### Phase 2: Medium Priority (Enhanced Features)
4. **Chat Leave Functionality** (Section 3 - partial)
5. **Group Chat** (Section 3 - if needed)
6. **Admin Create User** (Section 1)

### Phase 3: Low Priority (System Features)
7. **Batch Media Upload** (Section 5.2)
8. **Health Status Page** (Section 6 - optional)

---

## Execution Instructions for AI

When implementing each section:

1. **Read this plan carefully** before starting
2. **Follow the exact file paths** specified
3. **Use existing patterns** from similar modules in the codebase
4. **Do not modify unrelated code** - keep changes focused
5. **Test each hook/service** can be imported without errors
6. **Update barrel exports** (index.ts) when creating new modules
7. **Follow TypeScript strict mode** - no `any` types
8. **Use existing UI components** (shadcn/ui) for consistency
9. **Add proper error handling** with toast notifications
10. **Invalidate relevant queries** after mutations

---

## Notes for Human Review

- Review each section before asking AI to implement
- Sections can be implemented independently
- UI components may need design review before implementation
- Some features (group chat) may not be needed for MVP
- Health module is entirely optional

---

**Document Version:** 1.0
**Created:** 2026-02-01
**Last Updated:** 2026-02-01
