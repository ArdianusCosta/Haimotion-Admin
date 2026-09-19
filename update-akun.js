const fs = require('fs');

const path = 'components/finance/akun-perkiraan-page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add imports
const newImports = `
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
`;

code = code.replace("import { Button } from '@/components/ui/button'", "import { Button } from '@/components/ui/button'\n" + newImports);

// Replace the button with Dialog
const dialogCode = `
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#b85b24] hover:bg-[#a04e1f] text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-card">
              <div className="bg-[#b85b24] px-6 py-4">
                <DialogTitle className="text-xl font-medium text-white">Data Baru</DialogTitle>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nama Akun<span className="text-red-500">*</span></Label>
                    <Input placeholder="Gajian" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipe Akun<span className="text-red-500">*</span></Label>
                    <Select>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih Tipe Akun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tipe1">Tipe 1</SelectItem>
                        <SelectItem value="tipe2">Tipe 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Saldo<span className="text-red-500">*</span></Label>
                    <Input placeholder="Rp 8.072.280" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sub Tipe<span className="text-red-500">*</span></Label>
                    <Select>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih Sub Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sub1">Sub Tipe 1</SelectItem>
                        <SelectItem value="sub2">Sub Tipe 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label className="text-sm font-medium">Tanggal<span className="text-red-500">*</span></Label>
                    <Input type="date" className="bg-background" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <DialogClose asChild>
                    <Button variant="outline" className="border-border text-foreground hover:bg-muted">Batal</Button>
                  </DialogClose>
                  <Button className="bg-[#b85b24] hover:bg-[#a04e1f] text-white">Simpan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
`;

code = code.replace(
  /<Button className="bg-\[#b85b24\].*?Tambah<\/span>\n\s*<\/Button>/s, 
  dialogCode
);

fs.writeFileSync(path, code);
