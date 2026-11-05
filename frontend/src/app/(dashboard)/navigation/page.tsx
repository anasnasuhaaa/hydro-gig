import { DatasetMode } from "@/components/experimental/workspace";
import { NavigationWorkspace } from "@/components/demo/navigation-workspace";

export { navigationMetadata as generateMetadata } from "@/i18n/metadata";
export default function NavigationPage() {
  return (
    <DatasetMode>
      <NavigationWorkspace />
    </DatasetMode>
  );
}
