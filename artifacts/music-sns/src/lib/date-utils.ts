import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
  
  if (diffInDays < 1) {
    let rel = formatDistanceToNow(date, { locale: ja, addSuffix: true });
    // Simplify format
    rel = rel.replace("約", "").replace("以上", "");
    return rel;
  } else if (diffInDays < 2) {
    return "昨日";
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)}日前`;
  } else {
    return format(date, "yyyy/MM/dd");
  }
}
