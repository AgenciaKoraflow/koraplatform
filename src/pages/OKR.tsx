import { AppLayout } from "@/components/layout/AppLayout";
import { EmpresaOKR } from "@/components/empresa/EmpresaOKR";

export default function OKR() {
  return (
    <AppLayout>
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <EmpresaOKR />
      </div>
    </AppLayout>
  );
}
