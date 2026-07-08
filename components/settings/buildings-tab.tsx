"use client";

import { useState } from "react";
import { Building2, Plus, Trash2, Layers, DoorOpen, Edit } from "lucide-react";
import { addBuilding, updateBuilding, deleteBuilding, addFloor, updateFloor, deleteFloor, addRoom, updateRoom, deleteRoom } from "@/app/(dashboard)/settings/actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Save, X } from "lucide-react";

export function BuildingsTab({ data }: { data: any }) {
  const [loading, setLoading] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState<string>("");
  const [activeFloor, setActiveFloor] = useState<string>("");

  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [editingFloor, setEditingFloor] = useState<any>(null);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const handleAddBuilding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await addBuilding(new FormData(form));
    if (!res.success) alert(res.error);
    else form.reset();
    setLoading(false);
  };

  const handleUpdateBuilding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateBuilding(editingBuilding.id, new FormData(e.currentTarget));
    if (!res.success) alert(res.error);
    else setEditingBuilding(null);
    setLoading(false);
  };

  const handleAddFloor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await addFloor(new FormData(form));
    if (!res.success) alert(res.error);
    else form.reset();
    setLoading(false);
  };

  const handleUpdateFloor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateFloor(editingFloor.id, new FormData(e.currentTarget));
    if (!res.success) alert(res.error);
    else setEditingFloor(null);
    setLoading(false);
  };

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await addRoom(new FormData(form));
    if (!res.success) alert(res.error);
    else form.reset();
    setLoading(false);
  };

  const handleUpdateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateRoom(editingRoom.id, new FormData(e.currentTarget));
    if (!res.success) alert(res.error);
    else setEditingRoom(null);
    setLoading(false);
  };

  // Filtered data based on selection
  const visibleFloors = activeBuilding ? data.floors.filter((f: any) => f.building_id === activeBuilding) : [];
  const visibleRooms = activeFloor ? data.rooms.filter((r: any) => r.floor_id === activeFloor) : [];

  const teachers = data.profiles?.filter((p: any) => 
    ['homeroom_teacher', 'building_supervisor', 'grade_supervisor', 'deputy_director', 'director', 'administrator'].includes(p.role)
  ) || [];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buildings Column */}
        <div className="stat-card space-y-4 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            อาคาร
          </h2>
          
          <form onSubmit={handleAddBuilding} className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <input type="text" name="name" required placeholder="ชื่ออาคาร เช่น อาคาร 1" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            <div className="flex gap-2">
              <input type="text" name="code" required placeholder="รหัส เช่น B1" className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              <input type="number" name="total_floors" required placeholder="จำนวนชั้น" className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="w-full">
              <SearchableSelect 
                name="supervisor_id" 
                placeholder="-- เลือกหัวหน้าอาคาร (ถ้ามี) --"
                options={teachers.map((t: any) => ({ id: t.id, label: t.full_name }))} 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> เพิ่มอาคาร
            </button>
          </form>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {data.buildings.map((b: any) => (
              <div 
                key={b.id} 
                onClick={() => { setActiveBuilding(b.id); setActiveFloor(""); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeBuilding === b.id 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-100 dark:border-gray-800 hover:border-blue-300"
                }`}
              >
                {editingBuilding?.id === b.id ? (
                  <form onSubmit={handleUpdateBuilding} className="space-y-3">
                    <input type="text" name="name" defaultValue={b.name} required placeholder="ชื่ออาคาร" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                    <div className="flex gap-2">
                      <input type="text" name="code" defaultValue={b.code} required placeholder="รหัส" className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                      <input type="number" name="total_floors" defaultValue={b.total_floors} required placeholder="จำนวนชั้น" className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div className="w-full">
                      <SearchableSelect 
                        name="supervisor_id" 
                        defaultValue={b.supervisor_id || ""}
                        placeholder="-- เลือกหัวหน้าอาคาร (ถ้ามี) --"
                        options={teachers.map((t: any) => ({ id: t.id, label: t.full_name }))} 
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                        <Save className="w-4 h-4" /> บันทึก
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditingBuilding(null); }} className="py-2 px-3 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{b.name}</div>
                      <div className="text-xs text-gray-500 mb-1">รหัส: {b.code} • {b.total_floors} ชั้น</div>
                      {b.supervisor_id && (
                        <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded inline-block">
                          หัวหน้าอาคาร: {teachers.find((t: any) => t.id === b.supervisor_id)?.full_name || "ไม่ทราบชื่อ"}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingBuilding(b); }} className="p-1 text-gray-400 hover:text-blue-500">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); confirm("ลบอาคาร?") && deleteBuilding(b.id).then(r => !r.success && alert(r.error)); }} disabled={loading} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floors Column */}
        <div className="stat-card space-y-4 opacity-100 transition-opacity bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800" style={{ opacity: activeBuilding ? 1 : 0.5 }}>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-500" />
            ชั้น
          </h2>
          
          {activeBuilding ? (
            <>
              <form onSubmit={handleAddFloor} className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <input type="hidden" name="building_id" value={activeBuilding} />
                <div className="flex gap-2">
                  <input type="number" name="floor_number" required placeholder="เลขชั้น" className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                  <input type="text" name="name" required placeholder="ชื่อชั้น (เช่น ชั้น 1)" className="w-2/3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> เพิ่มชั้น
                </button>
              </form>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {visibleFloors.map((f: any) => (
                  <div 
                    key={f.id} 
                    onClick={() => setActiveFloor(f.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      activeFloor === f.id 
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20" 
                        : "border-gray-100 dark:border-gray-800 hover:border-cyan-300 bg-white dark:bg-gray-900"
                    }`}
                  >
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{f.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingFloor(f); }} className="p-1 text-gray-400 hover:text-cyan-500">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); confirm("ลบชั้น?") && deleteFloor(f.id).then(r => !r.success && alert(r.error)); }} disabled={loading} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-center py-10 text-gray-400">กรุณาเลือกอาคารก่อน</div>
          )}
        </div>

        {/* Rooms Column */}
        <div className="stat-card space-y-4 opacity-100 transition-opacity bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800" style={{ opacity: activeFloor ? 1 : 0.5 }}>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-purple-500" />
            ห้อง
          </h2>

          {activeFloor ? (
            <>
              <form onSubmit={handleAddRoom} className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <input type="hidden" name="building_id" value={activeBuilding} />
                <input type="hidden" name="floor_id" value={activeFloor} />
                <div className="flex gap-2">
                  <input type="text" name="room_number" required placeholder="เลขห้อง" className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                  <input type="text" name="name" required placeholder="ชื่อห้อง (เช่น ห้อง 101)" className="w-2/3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> เพิ่มห้อง
                </button>
              </form>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {visibleRooms.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{r.name}</div>
                      <div className="text-xs text-gray-500">ห้อง: {r.room_number}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingRoom(r)} className="p-1 text-gray-400 hover:text-purple-500">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => confirm("ลบห้อง?") && deleteRoom(r.id).then(res => !res.success && alert(res.error))} disabled={loading} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-center py-10 text-gray-400">กรุณาเลือกชั้นก่อน</div>
          )}
        </div>
      </div>

      {/* Modals */}
      {editingBuilding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateBuilding} className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">แก้ไขอาคาร</h3>
            <div className="space-y-3">
              <input type="text" name="name" defaultValue={editingBuilding.name} required placeholder="ชื่ออาคาร" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              <input type="text" name="code" defaultValue={editingBuilding.code} required placeholder="รหัส" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              <input type="number" name="total_floors" defaultValue={editingBuilding.total_floors} required placeholder="จำนวนชั้น" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingBuilding(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg">บันทึก</button>
            </div>
          </form>
        </div>
      )}

      {editingFloor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateFloor} className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">แก้ไขชั้น</h3>
            <div className="space-y-3">
              <input type="number" name="floor_number" defaultValue={editingFloor.floor_number} required placeholder="เลขชั้น" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              <input type="text" name="name" defaultValue={editingFloor.name} required placeholder="ชื่อชั้น" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingFloor(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg">บันทึก</button>
            </div>
          </form>
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateRoom} className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">แก้ไขห้อง</h3>
            <div className="space-y-3">
              <input type="text" name="room_number" defaultValue={editingRoom.room_number} required placeholder="เลขห้อง" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              <input type="text" name="name" defaultValue={editingRoom.name} required placeholder="ชื่อห้อง" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingRoom(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg">บันทึก</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
