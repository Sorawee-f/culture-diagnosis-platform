import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";
import { setAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
const schema=z.object({username:z.string().trim().min(1),password:z.string().min(1)});
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({message:'ข้อมูลไม่ถูกต้อง'},{status:400});const success=parsed.data.username===env.ADMIN_USERNAME&&await bcrypt.compare(parsed.data.password,env.ADMIN_PASSWORD_HASH);await supabaseAdmin.from('login_events').insert({actor_type:'admin',employee_id:null,success,user_agent:request.headers.get('user-agent')?.slice(0,300)??null});if(!success)return NextResponse.json({message:'Username หรือ Password ไม่ถูกต้อง'},{status:401});await setAdminSession({role:'admin',username:parsed.data.username});return NextResponse.json({ok:true});}
