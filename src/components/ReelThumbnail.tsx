import { useState } from "react";
import { ImageOff, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelThumbnailProps {
  thumbnailUrl: string | null | undefined;
  className?: string;
}

export function ReelThumbnail({ thumbnailUrl, className }: ReelThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  if (!thumbnailUrl || hasError) {
    return (
      <div className={cn("bg-muted flex flex-col items-center justify-center gap-2", className)}>
        {hasError ? (
          <>
            <ImageOff className="w-8 h-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sem imagem</span>
          </>
        ) : (
          <>
            <Play className="w-8 h-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Processando...</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-muted relative", className)}>
      <img
        src={thumbnailUrl}
        alt="Reel thumbnail"
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
