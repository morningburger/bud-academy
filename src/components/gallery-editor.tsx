"use client";

import { useActionState } from "react";
import { addGalleryImages, updateGallery, type ActionState } from "@/app/manage/actions";

export function GalleryEditor({ courseId, images, cover }: { courseId: string; images: string[]; cover: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addGalleryImages, null);
  const btn = (url: string, op: string, label: string, disabled = false) => (
    <form action={updateGallery}>
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="url" value={url} />
      <input type="hidden" name="op" value={op} />
      <button className="btn-gray btn-sm" disabled={disabled}>{label}</button>
    </form>
  );
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-bold mb-2">대표 이미지</p>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="w-full max-w-[420px] aspect-[16/10] object-cover rounded-2xl bg-surface" />
        ) : (
          <p className="text-sub text-[14px]">없음 · 아래 사진의 &lsquo;대표로&rsquo;를 누르거나 강좌 정보에서 올리세요.</p>
        )}
      </div>
      <div>
        <p className="font-bold mb-2">상세 이미지 {images.length}장</p>
        <p className="text-[14px] text-sub mb-3">강좌 페이지 &lsquo;자세히 보기&rsquo;에 위에서부터 보여요. 포스터, 커리큘럼표, 작품 사진을 올리면 좋아요.</p>
        {images.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {images.map((src, i) => (
              <li key={src} className="panel p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full aspect-[4/3] object-contain rounded-xl bg-surface" />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {btn(src, "up", "위로", i === 0)}
                  {btn(src, "down", "아래로", i === images.length - 1)}
                  {btn(src, "cover", "대표로", src === cover)}
                  {btn(src, "remove", "삭제")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form action={action} className="panel p-4 flex flex-col gap-3">
        <input type="hidden" name="course_id" value={courseId} />
        <label className="field-label" htmlFor="images">이미지 추가 (여러 장 선택 가능, 한 번에 4MB까지)</label>
        <input id="images" name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" className="block w-full text-[14px] text-sub file:btn-gray file:btn-sm file:border-0 file:mr-3" />
        <button className="btn-primary self-start" disabled={pending}>{pending ? "올리는 중" : "올리기"}</button>
        {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
        {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      </form>
    </div>
  );
}
