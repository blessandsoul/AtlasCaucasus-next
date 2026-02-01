'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTour, useUploadTourImage, useDeleteTourImage } from '../hooks/useTours';
import { getMediaUrl } from '@/lib/utils/media';

interface StagedFile {
    file: File;
    previewUrl: string;
}

interface TourImageManagerProps {
    tourId: string;
}

export const TourImageManager = ({ tourId }: TourImageManagerProps) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

    // Fetch fresh tour data to get current images
    const { data: tour, isLoading: isLoadingTour } = useTour(tourId);
    const uploadMutation = useUploadTourImage();
    const deleteMutation = useDeleteTourImage();

    const existingImages = tour?.images || [];

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            stagedFiles.forEach((staged) => {
                URL.revokeObjectURL(staged.previewUrl);
            });
        };
    }, [stagedFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newStagedFiles: StagedFile[] = Array.from(files).map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setStagedFiles((prev) => [...prev, ...newStagedFiles]);

        // Reset the input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveStaged = (index: number) => {
        setStagedFiles((prev) => {
            const newFiles = [...prev];
            // Revoke the URL before removing
            URL.revokeObjectURL(newFiles[index].previewUrl);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const handleUploadStaged = () => {
        if (stagedFiles.length === 0) return;

        const files = stagedFiles.map((s) => s.file);
        uploadMutation.mutate(
            { id: tourId, files },
            {
                onSuccess: () => {
                    // Clear staged files after successful upload
                    stagedFiles.forEach((staged) => {
                        URL.revokeObjectURL(staged.previewUrl);
                    });
                    setStagedFiles([]);
                },
            }
        );
    };

    const handleDeleteExisting = (imageId: string) => {
        deleteMutation.mutate({ tourId, imageId });
    };

    const hasContent = existingImages.length > 0 || stagedFiles.length > 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {t('tours.images.title', 'Photos')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {t('tours.images.subtitle', 'Upload photos to showcase your tour')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="tour-image-upload"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('tours.images.select', 'Select Photos')}
                    </Button>
                    {stagedFiles.length > 0 && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleUploadStaged}
                            disabled={uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('common.uploading', 'Uploading...')}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('tours.images.upload_count', 'Upload {{count}}', { count: stagedFiles.length })}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {isLoadingTour ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : hasContent ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Existing images from server */}
                    {existingImages.map((image) => (
                        <div
                            key={image.id}
                            className="relative group aspect-square rounded-lg overflow-hidden border"
                        >
                            <img
                                src={getMediaUrl(image.url)}
                                alt={image.altText || 'Tour image'}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteExisting(image.id)}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Staged files (not yet uploaded) */}
                    {stagedFiles.map((staged, index) => (
                        <div
                            key={`staged-${index}`}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-dashed border-primary/50 bg-primary/5"
                        >
                            <img
                                src={staged.previewUrl}
                                alt={`Staged image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                                {t('tours.images.new', 'New')}
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleRemoveStaged(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border rounded-lg bg-muted/30">
                    <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                        {t('tours.images.no_photos', 'No photos uploaded yet')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('tours.images.upload_hint', 'Upload photos to attract more customers')}
                    </p>
                </div>
            )}
        </div>
    );
};
