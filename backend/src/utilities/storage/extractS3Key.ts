export function extractS3Key(url: string): string {
    const parts = url.split(".com/");
    return parts[1];
  }
