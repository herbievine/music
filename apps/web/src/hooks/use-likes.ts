// Re-export from the canonical API layer.
// Import directly from @/api/likes for new code.
export {
	useLikes,
	useIsLiked,
	useLikeMutation,
	type Like,
	type LikeItemType,
	type LikesData,
	likesKeys,
} from "@/api/likes";
