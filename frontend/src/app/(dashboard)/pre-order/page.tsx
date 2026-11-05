import { DatasetMode } from "@/components/experimental/workspace";
import { PreOrderWorkspace } from "@/components/demo/pre-order-workspace";

export { screeningMetadata as generateMetadata } from "@/i18n/metadata";
export default function PreOrder() {
  return (
    <DatasetMode>
      <PreOrderWorkspace />
    </DatasetMode>
  );
}
