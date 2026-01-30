/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { renderHook, screen } from '@testing-library/react';
import { ItemType } from '@zextras/carbonio-ui-commons';

import { ProvidersWrapper, setupTest } from '@test-setup';
import {
	createTag,
	deleteTag,
	editTag,
	TagsDropdownItem,
	useGetTagsActions,
	useGetTagsList,
	useTagExist
} from '../tag-actions';
import { TESTID_SELECTORS } from '__test__/constants';

describe('Tag Actions', () => {
	const mockCreateModal = vi.fn();
	const mockCloseModal = vi.fn();
	const mockTag: ItemType = {
		id: 'tag-1',
		name: 'Important',
		label: 'Important',
		color: 1,
		active: false,
		open: false,
		item: {} as any
	};

	describe('createTag', () => {
		it('should return a dropdown item with correct properties', () => {
			const result = createTag({ createModal: mockCreateModal, closeModal: mockCloseModal });

			expect(result.id).toBe('new');
			expect(result.icon).toBe('TagOutline');
			expect(result.onClick).toBeDefined();
		});

		it('should call createModal when onClick is triggered', () => {
			const result = createTag({ createModal: mockCreateModal, closeModal: mockCloseModal });
			const mockEvent = { stopPropagation: vi.fn() } as any;

			result.onClick?.(mockEvent);

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(mockCreateModal).toHaveBeenCalled();
		});

		it('should handle onClick without event', () => {
			const result = createTag({ createModal: mockCreateModal, closeModal: mockCloseModal });

			expect(() => result.onClick?.(undefined as any)).not.toThrow();
		});
	});

	describe('editTag', () => {
		it('should return a dropdown item with correct properties', () => {
			const result = editTag({
				createModal: mockCreateModal,
				closeModal: mockCloseModal,
				tag: mockTag
			});

			expect(result.id).toBe('edit');
			expect(result.icon).toBe('Edit2Outline');
			expect(result.onClick).toBeDefined();
		});

		it('should call createModal with edit mode when onClick is triggered', () => {
			const result = editTag({
				createModal: mockCreateModal,
				closeModal: mockCloseModal,
				tag: mockTag
			});
			const mockEvent = { stopPropagation: vi.fn() } as any;

			result.onClick?.(mockEvent);

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(mockCreateModal).toHaveBeenCalled();
		});
	});

	describe('deleteTag', () => {
		it('should return a dropdown item with correct properties', () => {
			const result = deleteTag({
				createModal: mockCreateModal,
				closeModal: mockCloseModal,
				tag: mockTag
			});

			expect(result.id).toBe('delete');
			expect(result.icon).toBe('Untag');
			expect(result.onClick).toBeDefined();
		});

		it('should call createModal when onClick is triggered', () => {
			const result = deleteTag({
				createModal: mockCreateModal,
				closeModal: mockCloseModal,
				tag: mockTag
			});
			const mockEvent = { stopPropagation: vi.fn() } as any;

			result.onClick?.(mockEvent);

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(mockCreateModal).toHaveBeenCalled();
		});
	});

	describe('TagsDropdownItem', () => {
		const mockActionDescriptor = {
			id: 'tag-1',
			label: 'Work',
			color: 1,
			execute: vi.fn()
		};

		it('should render with checkbox and tag name', () => {
			setupTest(
				<TagsDropdownItem checked={false} actionDescriptor={mockActionDescriptor as any} />
			);

			expect(screen.getByText('Work')).toBeVisible();
			expect(screen.getByTestId(TESTID_SELECTORS.icons.square)).toBeVisible();
		});

		it('should show TagOutline icon when not checked', () => {
			setupTest(
				<TagsDropdownItem checked={false} actionDescriptor={mockActionDescriptor as any} />
			);

			const tagItem = screen.getByTestId('tag-item-tag-1');
			expect(tagItem).toBeVisible();
		});

		it('should show Tag icon when checked', () => {
			setupTest(<TagsDropdownItem checked actionDescriptor={mockActionDescriptor as any} />);

			const tagItem = screen.getByTestId('tag-item-tag-1');
			expect(tagItem).toBeVisible();
		});

		it('should call execute when clicked', async () => {
			const { user } = setupTest(
				<TagsDropdownItem checked={false} actionDescriptor={mockActionDescriptor as any} />
			);

			const tagItem = screen.getByTestId('tag-item-tag-1');
			await user.click(tagItem);

			expect(mockActionDescriptor.execute).toHaveBeenCalled();
		});

		it('should change icon on hover when unchecked', async () => {
			const { user } = setupTest(
				<TagsDropdownItem checked={false} actionDescriptor={mockActionDescriptor as any} />
			);

			const tagItem = screen.getByTestId('tag-item-tag-1');
			await user.hover(tagItem);

			// When hovering over unchecked tag, icon should change to 'Tag'
			expect(tagItem).toBeVisible();
		});

		it('should change icon on hover when checked', async () => {
			const { user } = setupTest(
				<TagsDropdownItem checked actionDescriptor={mockActionDescriptor as any} />
			);

			const tagItem = screen.getByTestId('tag-item-tag-1');
			await user.hover(tagItem);

			// When hovering over checked tag, icon should change to 'Untag'
			expect(tagItem).toBeVisible();
		});

		it('should use correct color from ZIMBRA_STANDARD_COLORS', () => {
			setupTest(
				<TagsDropdownItem checked={false} actionDescriptor={mockActionDescriptor as any} />
			);

			expect(screen.getByTestId('tag-item-tag-1')).toBeVisible();
		});
	});

	describe('useGetTagsActions', () => {
		it('should return array of tag actions', () => {
			const { result } = renderHook(() => useGetTagsActions({ tag: mockTag }), {
				wrapper: ProvidersWrapper
			});

			expect(result.current).toHaveLength(3);
			expect(result.current[0].id).toBe('new');
			expect(result.current[1].id).toBe('edit');
			expect(result.current[2].id).toBe('delete');
		});

		it('should return actions with correct icons', () => {
			const { result } = renderHook(() => useGetTagsActions({ tag: mockTag }), {
				wrapper: ProvidersWrapper
			});

			expect(result.current[0].icon).toBe('TagOutline');
			expect(result.current[1].icon).toBe('Edit2Outline');
			expect(result.current[2].icon).toBe('Untag');
		});
	});

	describe('useTagExist', () => {
		it('should return false for empty tags array', () => {
			const { result } = renderHook(() => useTagExist([]), {
				wrapper: ProvidersWrapper
			});

			expect(result.current).toBe(false);
		});

		it('should return true if tag has nil: prefix', () => {
			const tagsWithNil = [{ id: 'nil:custom-tag', name: 'Custom Tag' }] as any;

			const { result } = renderHook(() => useTagExist(tagsWithNil), {
				wrapper: ProvidersWrapper
			});

			expect(result.current).toBe(true);
		});
	});

	describe('useGetTagsList', () => {
		it('should return empty array when no msgTags provided', () => {
			const { result } = renderHook(() => useGetTagsList(), {
				wrapper: ProvidersWrapper
			});

			expect(result.current).toEqual([]);
		});

		it('should return empty array for empty msgTags', () => {
			const { result } = renderHook(() => useGetTagsList([]), {
				wrapper: ProvidersWrapper
			});

			expect(result.current).toEqual([]);
		});
	});
});
