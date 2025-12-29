# Chat Post Sharing Feature

## Overview

This document describes the enriched post sharing feature that allows users to share posts in chat conversations with rich preview cards that are clickable and redirect to the full post.

## Architecture

### Backend Flow (Java - chefkix-chat-service)

1. **Message Creation** (`ChatMessageService.create`)
   - Validates message type (`TEXT` or `POST_SHARE`)
   - For `POST_SHARE`:
     - Calls `PostClient.getPostDetail(relatedId)` to fetch post metadata
     - Extracts enriched snapshot from `InternalPostResponse`:
       - `sharedPostImage`: First image from `photoUrls` array
       - `sharedPostTitle`: Recipe title (prioritized for cooking posts)
     - Auto-fills message caption if not provided by user
     - Caches snapshot data directly in `ChatMessage` entity

2. **WebSocket Broadcast**
   - Message is broadcasted to `/topic/conversation/{conversationId}`
   - All participants receive the enriched message with cached snapshot

3. **Entities & DTOs**

   ```java
   // ChatMessage entity
   MessageType type = MessageType.TEXT | POST_SHARE
   String relatedId // Post ID
   String sharedPostImage // Cached thumbnail
   String sharedPostTitle // Cached recipe title

   // ChatMessageResponse DTO (same fields)
   ```

### Frontend Flow (TypeScript - Next.js)

1. **Share Action** (`SharePostModal`)
   - User selects conversations from recent chats
   - Optional custom message (auto-filled if empty)
   - Calls `sharePostToConversation()` service

2. **Service Layer** (`chat.ts`)

   ```typescript
   interface ChatMessage {
   	type?: 'TEXT' | 'POST_SHARE'
   	relatedId?: string // Post ID
   	sharedPostImage?: string // Thumbnail
   	sharedPostTitle?: string // Recipe title
   	// ... standard fields
   }
   ```

3. **Mapping** (`mapChatMessageToMessage`)
   - Converts backend `ChatMessage` to frontend `Message` format
   - Constructs `SharedPostSnapshot` object from cached fields
   - Derives navigation URL: `/post/[postId]`

4. **WebSocket** (`useChatWebSocket`)
   - Receives real-time messages
   - Preserves all POST_SHARE metadata
   - Updates local message list

5. **Rendering** (`ChatMessage` component)
   - Detects `type === 'POST_SHARE'`
   - Renders clickable preview card with:
     - Thumbnail image
     - Recipe title (if available)
     - "Shared Post" badge
     - Caption/message
     - "Tap to view post" indicator
   - Wraps in `<Link href={`/post/${relatedId}`}>`

## Data Flow Diagram

```
┌─────────────────┐
│ SharePostModal  │ User clicks share button
└────────┬────────┘
         │ sharePostToConversation()
         ↓
┌─────────────────┐
│   API Gateway   │ POST /api/v1/chat/messages/create
└────────┬────────┘
         │ type: POST_SHARE, relatedId: postId
         ↓
┌─────────────────┐
│  Chat Service   │ ChatMessageService.create()
└────────┬────────┘
         │
         ├─→ PostClient.getPostDetail(postId)
         │   └─→ Returns InternalPostResponse
         │
         ├─→ Cache snapshot:
         │   • sharedPostImage = photoUrls[0]
         │   • sharedPostTitle = recipeTitle
         │
         ├─→ Save to MongoDB
         │
         └─→ WebSocket broadcast
             └─→ /topic/conversation/{id}
                 │
                 ↓
         ┌───────────────┐
         │  All Clients  │ useChatWebSocket receives
         └───────┬───────┘
                 │ handleIncomingMessage()
                 ↓
         ┌───────────────┐
         │ Messages Page │ Updates local state
         └───────┬───────┘
                 │ MessageBubble → mapChatMessageToMessage()
                 ↓
         ┌───────────────┐
         │ ChatMessage   │ Renders preview card
         │  Component    │ with Link to /post/[id]
         └───────────────┘
```

## Key Files

### Backend

- `ChatMessageService.java` - Message creation & snapshot caching
- `ChatMessage.java` - Entity with cached fields
- `ChatMessageResponse.java` - DTO with same fields
- `InternalPostResponse.java` - Rich post metadata from post-service

### Frontend

- `src/services/chat.ts` - API service & mapping functions
- `src/hooks/useChatWebSocket.ts` - WebSocket connection & message handling
- `src/components/messages/ChatMessage.tsx` - Message rendering with POST_SHARE support
- `src/components/social/SharePostModal.tsx` - Share UI & conversation selection
- `src/app/(main)/messages/page.tsx` - Chat page integration

## Usage Example

### Sharing a Post

```typescript
import { sharePostToConversation } from '@/services/chat'

// From post card or detail page
const handleShare = async (conversationId: string, postId: string) => {
	const response = await sharePostToConversation({
		conversationId,
		relatedId: postId,
		type: 'POST_SHARE',
		message: 'Check out this recipe!', // Optional
	})

	if (response.success) {
		// Backend has cached thumbnail + title
		console.log('Cached snapshot:', {
			image: response.data.sharedPostImage,
			title: response.data.sharedPostTitle,
		})
	}
}
```

### Rendering in Chat

```typescript
// ChatMessage component automatically handles POST_SHARE
{messages.map(msg => (
  <ChatMessage
    key={msg.id}
    message={mapChatMessageToMessage(msg)} // Includes sharedPost snapshot
    senderAvatar={msg.sender.avatar}
    senderName={msg.sender.firstName}
  />
))}

// For POST_SHARE messages:
// - Renders as clickable card
// - Shows thumbnail (msg.sharedPostImage)
// - Shows title (msg.sharedPostTitle)
// - Links to /post/[msg.relatedId]
```

## Snapshot Caching Strategy

### Why Cache?

1. **Performance**: Avoid fetching post details on every message render
2. **Reliability**: Post preview works even if post is later deleted/private
3. **Consistency**: All recipients see same snapshot at share time

### What's Cached?

- ✅ **Thumbnail**: First image from post's photoUrls array
- ✅ **Recipe Title**: Prioritized for cooking posts (more meaningful than generic content)
- ✅ **Post ID**: For navigation/redirect
- ⏳ **Future**: Full photoUrls array, recipeId, sessionId (when backend expands)

### Cache Location

- **Database**: MongoDB `chat_message` collection
- **Fields**: `sharedPostImage`, `sharedPostTitle`, `relatedId`
- **Lifetime**: Permanent (tied to message lifecycle)

## Future Enhancements

### Planned Backend Improvements

```java
// Expand cached fields in ChatMessage entity
String[] photoUrls; // All images for gallery preview
String recipeId; // Direct recipe navigation
String sessionId; // Link to cooking session
String content; // Post caption snippet
```

### Planned Frontend Improvements

- Gallery preview (swipeable thumbnails)
- Direct recipe/session links
- In-chat post actions (like, comment)
- Offline support with cached snapshots
- Share to multiple conversations in one action

## Testing Checklist

### Manual Testing

- [ ] Share cooking post → verify recipe title appears
- [ ] Share regular post → verify content snippet appears
- [ ] Custom message → verify overrides auto-caption
- [ ] WebSocket delivery → verify real-time appearance
- [ ] Click preview card → verify navigates to post detail
- [ ] Multiple shares → verify works for multiple conversations
- [ ] Offline → verify REST fallback works
- [ ] Post deleted → verify cached preview still works

### Integration Points

- ✅ SharePostModal → API → Backend
- ✅ Backend → WebSocket → Frontend
- ✅ Frontend → ChatMessage component
- ✅ ChatMessage → Next.js routing

## Troubleshooting

### Preview Not Showing

1. Check backend logs for POST_SHARE message creation
2. Verify `sharedPostImage` and `sharedPostTitle` are populated
3. Check WebSocket payload includes cached fields
4. Verify `mapChatMessageToMessage()` constructs `sharedPost` object

### Navigation Not Working

1. Verify `relatedId` contains valid post ID
2. Check Next.js routing: `/post/[id]` route exists
3. Verify Link component is rendered (not just div)

### Auto-Caption Issues

1. Backend auto-fills if `message` field is empty
2. Uses recipe title for cooking posts
3. Falls back to content snippet for regular posts

## Performance Considerations

- **Snapshot Caching**: Eliminates N+1 queries for post metadata
- **WebSocket**: Real-time delivery without polling
- **Image Optimization**: Uses Next.js Image component with CDN URLs
- **Lazy Loading**: Messages load on scroll (future: pagination)

## Security Notes

- Post visibility validated at share time (backend checks access)
- Cached snapshot preserved even if post becomes private later
- User can only share to conversations they're participants in
- All WebSocket messages validated with JWT authentication
