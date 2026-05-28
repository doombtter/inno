'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { ImageUploader } from './image-uploader';
import { useCurrentUser } from './auth-guard';
import { useCategories } from '@/hooks/use-categories';
import {
  useCreateInsight,
  useDeleteInsight,
  usePublishInsight,
  useUpdateInsight,
} from '@/hooks/use-insights';
import { ApiError } from '@/lib/api';
import type { AdminInsight, InsightPayload } from '@/lib/types';

interface Props {
  initial?: AdminInsight;
}

interface FormState {
  slug: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  bodyMarkdown: string;
  relatedProductIds: string;  // CSV in the textarea; split on save
  categorySlug: string;
}

function fromInitial(i: AdminInsight): FormState {
  return {
    slug: i.slug,
    title: i.title,
    subtitle: i.subtitle ?? '',
    thumbnail: i.thumbnail ?? '',
    bodyMarkdown: i.bodyMarkdown,
    relatedProductIds: i.relatedProductIds.join(', '),
    categorySlug: i.categorySlug ?? '',
  };
}

function blank(): FormState {
  return {
    slug: '',
    title: '',
    subtitle: '',
    thumbnail: '',
    bodyMarkdown: '',
    relatedProductIds: '',
    categorySlug: '',
  };
}

export function InsightForm({ initial }: Props) {
  const router = useRouter();
  const categories = useCategories();
  const user = useCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [state, setState] = useState<FormState>(() =>
    initial ? fromInitial(initial) : blank(),
  );
  const [error, setError] = useState<string | null>(null);

  const create = useCreateInsight();
  const update = useUpdateInsight(initial?.id ?? '');
  const publish = usePublishInsight(initial?.id ?? '');
  const remove = useDeleteInsight();

  const pending =
    create.isPending ||
    update.isPending ||
    publish.isPending ||
    remove.isPending;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(state.slug)) {
      setError('slug은 소문자/숫자/하이픈만 사용할 수 있습니다');
      return;
    }
    if (!state.title.trim()) {
      setError('제목을 입력하세요');
      return;
    }

    const relatedIds = state.relatedProductIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: InsightPayload = {
      slug: state.slug,
      title: state.title.trim(),
      subtitle: state.subtitle.trim() || undefined,
      thumbnail: state.thumbnail.trim() || undefined,
      bodyMarkdown: state.bodyMarkdown,
      relatedProductIds: relatedIds,
      categorySlug: state.categorySlug || null,
    };

    try {
      if (initial) {
        await update.mutateAsync(payload);
      } else {
        const created = await create.mutateAsync(payload);
        router.replace(`/insights/${created.id}`);
        return;
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `${e.status === 409 ? '중복' : '실패'}: ${e.message}`
          : (e as Error).message,
      );
    }
  }

  async function togglePublish() {
    if (!initial) return;
    try {
      const next = initial.publishedAt ? null : new Date().toISOString();
      await publish.mutateAsync(next);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : (e as Error).message,
      );
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm(`인사이트 '${initial.title}' 를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    try {
      await remove.mutateAsync(initial.id);
      router.replace('/insights');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : (e as Error).message,
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
          <h2 className="text-sm font-medium">메타</h2>
          <div>
            <Label required>제목</Label>
            <Input
              value={state.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div>
            <Label required hint="URL에 사용됩니다 — 소문자/숫자/하이픈만">
              slug
            </Label>
            <Input
              value={state.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="예: orange-juice-roundup"
              required
            />
          </div>
          <div>
            <Label>부제목</Label>
            <Input
              value={state.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
            />
          </div>
          <div>
            <Label>관련 카테고리</Label>
            <Select
              value={state.categorySlug}
              onChange={(e) => set('categorySlug', e.target.value)}
            >
              <option value="">(없음)</option>
              {categories.data?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label hint="UUID, 쉼표로 구분 — 본문 안에 [[product:&lt;id&gt;]] 토큰을 두면 본 앱에서 카드로 렌더링됩니다">
              관련 제품 ID
            </Label>
            <Textarea
              rows={2}
              value={state.relatedProductIds}
              onChange={(e) => set('relatedProductIds', e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-medium">썸네일</h2>
          <div className="flex gap-2">
            <Input
              value={state.thumbnail}
              onChange={(e) => set('thumbnail', e.target.value)}
              placeholder="https://... 또는 업로드"
            />
            <ImageUploader
              onUploaded={(url) => set('thumbnail', url)}
            />
          </div>
          {state.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.thumbnail}
              alt="thumbnail"
              className="w-full aspect-video object-cover rounded border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0.3';
              }}
            />
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-2">
          <h2 className="text-sm font-medium">본문 (Markdown)</h2>
          <Textarea
            rows={18}
            value={state.bodyMarkdown}
            onChange={(e) => set('bodyMarkdown', e.target.value)}
            className="font-mono text-xs"
            placeholder="# 제목&#10;&#10;본문..."
          />
        </div>
      </section>

      <section className="space-y-4">
        {initial && (
          <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
            <h2 className="text-sm font-medium flex items-center justify-between">
              발행 상태
              {initial.publishedAt ? (
                <span className="text-xs px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                  발행됨
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
                  비공개
                </span>
              )}
            </h2>
            {initial.publishedAt && (
              <p className="text-xs text-gray-500">
                {new Date(initial.publishedAt).toLocaleString('ko-KR')} 부터
              </p>
            )}
            {isAdmin ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={togglePublish}
                  disabled={pending}
                >
                  {initial.publishedAt ? '비공개로 전환' : '발행'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={onDelete}
                  disabled={pending}
                >
                  삭제
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                발행/비공개 전환과 삭제는 admin 역할만 수행할 수 있습니다.
              </p>
            )}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h2 className="text-sm font-medium mb-3">미리보기</h2>
          <article className="prose prose-sm max-w-none">
            {state.title && <h1>{state.title}</h1>}
            {state.subtitle && (
              <p className="text-gray-600">{state.subtitle}</p>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {state.bodyMarkdown || '_본문이 비어있습니다._'}
            </ReactMarkdown>
          </article>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/insights')}
          >
            취소
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? '저장 중…' : initial ? '저장' : '등록'}
          </Button>
        </div>
      </section>
    </form>
  );
}
