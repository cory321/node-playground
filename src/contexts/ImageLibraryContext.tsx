import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import {
	GeneratedImage,
	uploadGeneratedImage,
	listGeneratedImages,
	deleteGeneratedImage,
	hasImageStorage,
} from '@/api/supabase';

// Context state
interface ImageLibraryState {
	images: GeneratedImage[];
	isLoading: boolean;
	error: string | null;
	isOpen: boolean;
	hasStorage: boolean;
}

// Context actions
interface ImageLibraryActions {
	addImage: (
		dataUrl: string,
		prompt: string,
		aspectRatio: string,
		nodeId?: string,
	) => Promise<GeneratedImage | null>;
	removeImage: (id: string, storagePath: string) => Promise<boolean>;
	refreshImages: () => Promise<void>;
	openPanel: () => void;
	closePanel: () => void;
	togglePanel: () => void;
}

type ImageLibraryContextType = ImageLibraryState & ImageLibraryActions;

const ImageLibraryContext = createContext<ImageLibraryContextType | null>(null);

interface ImageLibraryProviderProps {
	children: React.ReactNode;
}

export function ImageLibraryProvider({ children }: ImageLibraryProviderProps) {
	const [images, setImages] = useState<GeneratedImage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const hasStorage = hasImageStorage();

	// Refresh images from Supabase
	const refreshImages = useCallback(async () => {
		if (!hasStorage) return;

		setIsLoading(true);
		setError(null);

		try {
			const data = await listGeneratedImages();
			setImages(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to load images';
			setError(message);
			console.error('Error loading images:', err);
		} finally {
			setIsLoading(false);
		}
	}, [hasStorage]);

	// Load images on mount
	useEffect(() => {
		if (hasStorage) {
			refreshImages();
		}
	}, [hasStorage, refreshImages]);

	// Add a new image
	const addImage = useCallback(
		async (
			dataUrl: string,
			prompt: string,
			aspectRatio: string,
			nodeId?: string,
		): Promise<GeneratedImage | null> => {
			if (!hasStorage) {
				console.warn('Image storage not available');
				return null;
			}

			try {
				const newImage = await uploadGeneratedImage(
					dataUrl,
					prompt,
					aspectRatio,
					nodeId,
				);

				if (newImage) {
					// Add to local state immediately
					setImages((prev) => [newImage, ...prev]);
				}

				return newImage;
			} catch (err) {
				console.error('Error adding image:', err);
				return null;
			}
		},
		[hasStorage],
	);

	// Remove an image
	const removeImage = useCallback(
		async (id: string, storagePath: string): Promise<boolean> => {
			if (!hasStorage) return false;

			try {
				const success = await deleteGeneratedImage(id, storagePath);

				if (success) {
					// Remove from local state immediately
					setImages((prev) => prev.filter((img) => img.id !== id));
				}

				return success;
			} catch (err) {
				console.error('Error removing image:', err);
				return false;
			}
		},
		[hasStorage],
	);

	// Panel controls
	const openPanel = useCallback(() => setIsOpen(true), []);
	const closePanel = useCallback(() => setIsOpen(false), []);
	const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);

	const value: ImageLibraryContextType = {
		images,
		isLoading,
		error,
		isOpen,
		hasStorage,
		addImage,
		removeImage,
		refreshImages,
		openPanel,
		closePanel,
		togglePanel,
	};

	return (
		<ImageLibraryContext.Provider value={value}>
			{children}
		</ImageLibraryContext.Provider>
	);
}

// Hook to use the image library context
export function useImageLibrary(): ImageLibraryContextType {
	const context = useContext(ImageLibraryContext);
	if (!context) {
		throw new Error(
			'useImageLibrary must be used within an ImageLibraryProvider',
		);
	}
	return context;
}

// Hook to get just the image count (for badges)
export function useImageCount(): number {
	const { images } = useImageLibrary();
	return images.length;
}

export default ImageLibraryContext;
