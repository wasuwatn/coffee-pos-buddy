import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Profile / role ----------
export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, shop_name, owner_id").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return {
      userId,
      profile,
      roles: (roles ?? []).map((r) => r.role),
      isOwner: (roles ?? []).some((r) => r.role === "owner"),
    };
  });

export const updateShopName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { shopName: string; fullName?: string }) =>
    z.object({ shopName: z.string().trim().min(1).max(80), fullName: z.string().trim().max(80).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ shop_name: data.shopName, full_name: data.fullName ?? undefined, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Catalog ----------
export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: categories, error: e1 }, { data: products, error: e2 }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("created_at"),
      supabase.from("products").select("*").eq("is_active", true).order("sort_order").order("created_at"),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { categories: categories ?? [], products: products ?? [] };
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; color?: string; sortOrder?: number }) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().trim().min(1).max(40),
      color: z.string().max(20).optional(),
      sortOrder: z.number().int().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { owner_id: userId, name: data.name, color: data.color ?? "#2d8ac9", sort_order: data.sortOrder ?? 0 };
    const q = data.id
      ? supabase.from("categories").update(payload).eq("id", data.id).select().single()
      : supabase.from("categories").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; price: number; categoryId?: string | null; color?: string; imageUrl?: string | null; isActive?: boolean }) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().trim().min(1).max(60),
      price: z.number().min(0).max(999999),
      categoryId: z.string().uuid().nullable().optional(),
      color: z.string().max(20).optional(),
      imageUrl: z.string().url().nullable().optional(),
      isActive: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      owner_id: userId,
      name: data.name,
      price: data.price,
      category_id: data.categoryId ?? null,
      color: data.color ?? "#2d8ac9",
      image_url: data.imageUrl ?? null,
      is_active: data.isActive ?? true,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? supabase.from("products").update(payload).eq("id", data.id).select().single()
      : supabase.from("products").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Orders ----------
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    items: { productId: string; name: string; price: number; qty: number }[];
    paymentMethod: "cash" | "transfer";
    cashReceived?: number | null;
  }) =>
    z.object({
      items: z.array(z.object({
        productId: z.string().uuid(),
        name: z.string().min(1).max(80),
        price: z.number().min(0),
        qty: z.number().int().min(1),
      })).min(1),
      paymentMethod: z.enum(["cash", "transfer"]),
      cashReceived: z.number().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("owner_id, full_name").eq("id", userId).maybeSingle();
    const ownerId = profile?.owner_id ?? userId;
    const subtotal = data.items.reduce((n, i) => n + i.price * i.qty, 0);
    const total = subtotal;
    const change = data.paymentMethod === "cash" && data.cashReceived != null ? Math.max(0, data.cashReceived - total) : null;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        owner_id: ownerId,
        cashier_id: userId,
        cashier_name: profile?.full_name ?? null,
        subtotal,
        total,
        payment_method: data.paymentMethod,
        cash_received: data.paymentMethod === "cash" ? data.cashReceived ?? null : null,
        change_amount: change,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const itemRows = data.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      name_snapshot: i.name,
      price_snapshot: i.price,
      qty: i.qty,
      line_total: i.price * i.qty,
    }));
    const { error: e2 } = await supabase.from("order_items").insert(itemRows);
    if (e2) throw new Error(e2.message);
    return { orderId: order.id };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: order, error: e1 }, { data: items, error: e2 }] = await Promise.all([
      context.supabase.from("orders").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("order_items").select("*").eq("order_id", data.id),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (!order) throw new Error("ไม่พบบิล");
    return { order, items: items ?? [] };
  });

// ---------- Seed sample menu (owner only, when catalog is empty) ----------
export const seedSampleMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { seeded: false };

    const cats = [
      { name: "เอสเปรสโซ่", color: "#6b3a2a", sort_order: 1 },
      { name: "นมสด", color: "#c9a568", sort_order: 2 },
      { name: "ชา / มัทฉะ", color: "#4a6741", sort_order: 3 },
      { name: "โซดา", color: "#2d8ac9", sort_order: 4 },
      { name: "ขนม", color: "#c17c74", sort_order: 5 },
    ];
    const { data: catRows, error: e1 } = await supabase
      .from("categories")
      .insert(cats.map((c) => ({ ...c, owner_id: userId })))
      .select();
    if (e1) throw new Error(e1.message);
    const cat = (name: string) => catRows!.find((c) => c.name === name)!.id;

    const products = [
      { name: "เอสเปรสโซ่", price: 55, category: "เอสเปรสโซ่", color: "#3d2817" },
      { name: "อเมริกาโน่", price: 60, category: "เอสเปรสโซ่", color: "#5c3a1f" },
      { name: "ลาเต้", price: 70, category: "เอสเปรสโซ่", color: "#8b6f5e" },
      { name: "คาปูชิโน่", price: 70, category: "เอสเปรสโซ่", color: "#a0522d" },
      { name: "มอคค่า", price: 75, category: "เอสเปรสโซ่", color: "#6b3a2a" },
      { name: "นมสดร้อน", price: 55, category: "นมสด", color: "#c9a568" },
      { name: "โกโก้เย็น", price: 65, category: "นมสด", color: "#8b6f5e" },
      { name: "มัทฉะลาเต้", price: 75, category: "ชา / มัทฉะ", color: "#4a6741" },
      { name: "ชาไทยเย็น", price: 60, category: "ชา / มัทฉะ", color: "#c4654a" },
      { name: "ชาเขียวเย็น", price: 60, category: "ชา / มัทฉะ", color: "#87a878" },
      { name: "โซดามะนาว", price: 55, category: "โซดา", color: "#73ffb8" },
      { name: "โซดาสตรอเบอร์รี่", price: 65, category: "โซดา", color: "#ee5a70" },
      { name: "ครัวซองต์", price: 55, category: "ขนม", color: "#e8b84a" },
      { name: "บราวนี่", price: 65, category: "ขนม", color: "#5c2018" },
    ];
    const { error: e2 } = await supabase.from("products").insert(
      products.map((p, i) => ({ owner_id: userId, name: p.name, price: p.price, category_id: cat(p.category), color: p.color, sort_order: i })),
    );
    if (e2) throw new Error(e2.message);
    return { seeded: true };
  });
