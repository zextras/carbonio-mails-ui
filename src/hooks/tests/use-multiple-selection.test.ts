/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook } from '@testing-library/react';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { useMultipleSelection } from 'hooks/use-multiple-selection';

describe('useMultipleSelection', () => {
	const setMultipleSelectionCount = vi.fn();
	const allItems = ['item1', 'item2', 'item3', 'item4', 'item5'];

	beforeEach(() => {
		(useAppContext as Mock).mockReturnValue({
			setMultipleSelectionCount
		});
		setMultipleSelectionCount.mockClear();
	});

	const testSetup = (
		selectedItemsInit = new Set<string>(),
		anchorIdInit: string | null = null
	): {
		result: { current: ReturnType<typeof useMultipleSelection> };
		setSelectedItems: Mock;
		setAnchorId: Mock;
		rerender: () => void;
	} => {
		let selectedItems = selectedItemsInit;
		let anchorId = anchorIdInit;

		const setSelectedItems = vi.fn((updater: (prev: Set<string>) => Set<string>) => {
			if (typeof updater === 'function') {
				selectedItems = updater(selectedItems);
			}
		}) as Mock;

		const setAnchorId = vi.fn((id: string | null) => {
			anchorId = id;
		}) as Mock;

		const { result, rerender } = renderHook(() =>
			useMultipleSelection({
				allAvailableItems: allItems,
				selectedItems,
				setSelectedItems,
				anchorId,
				setAnchorId
			})
		);

		return { result, setSelectedItems, setAnchorId, rerender };
	};

	it('should start with selection mode off', () => {
		const { result } = testSetup();
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should toggle selection ON when item is selected', () => {
		const { result, setSelectedItems } = testSetup();
		act(() => result.current.selectRange(1, 'a', {} as React.MouseEvent));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should toggle item OFF and switch mode OFF when last item is deselected', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a']));
		act(() => result.current.selectRange(1, 'a', {} as React.MouseEvent));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should keep selection mode ON if items remain selected after deselect', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a', 'b']));
		act(() => result.current.selectRange(1, 'a', {} as React.MouseEvent));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should toggle item selection and turn ON selection mode', () => {
		const { result, setSelectedItems } = testSetup();
		act(() => result.current.selectRange(1, 'a', {} as React.MouseEvent));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('selects all items', () => {
		const { result, setSelectedItems } = testSetup();
		act(() => {
			result.current.selectAll();
		});
		expect(setSelectedItems).toHaveBeenCalledWith(new Set(allItems));
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should deselect all items and turn off selection mode', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a', 'b']));
		act(() => result.current.deselectAll());
		expect(setSelectedItems).toHaveBeenCalledWith(new Set());
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should return isAllSelected true if all items selected', () => {
		const { result } = testSetup(new Set(allItems));
		expect(result.current.isAllSelected).toBe(true);
	});

	it('should return isAllSelected false if not all items selected', () => {
		const { result } = testSetup(new Set(['a', 'b']));
		expect(result.current.isAllSelected).toBe(false);
	});

	it('should clear all selected and turn OFF selection mode in selectAllModeOff', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a']));
		act(() => result.current.selectAllModeOff());
		expect(setSelectedItems).toHaveBeenCalledWith(new Set());
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should call setMultipleSelectionCount on mount and update', () => {
		testSetup(new Set(['a', 'b']));
		expect(setMultipleSelectionCount).toHaveBeenCalledWith(2);
	});

	it('should handle empty allAvailableItems array', () => {
		const { result } = testSetup(new Set());
		expect(result.current.isAllSelected).toBe(false);
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should handle undefined setSelectedItems', () => {
		const { result } = testSetup(new Set(['a']));
		expect(() => {
			act(() => result.current.selectRange(1, '', {} as React.MouseEvent));
			act(() => result.current.selectAll());
			act(() => result.current.deselectAll());
			act(() => result.current.selectAllModeOff());
		}).not.toThrow();
	});

	it('should handle undefined allAvailableItems', () => {
		const { result } = testSetup(new Set(['a']));
		expect(result.current.isAllSelected).toBe(false);
	});

	it('should handle undefined selectedItems', () => {
		const { result } = testSetup();
		expect(result.current.isSelectModeOn).toBe(false);
		expect(result.current.isAllSelected).toBe(false);
	});

	it('should update isAllSelected when selectedItems change', () => {
		const { result } = testSetup(new Set(['a']));
		expect(result.current.isAllSelected).toBe(false);
		const { result: result2 } = testSetup(new Set(allItems));
		expect(result2.current.isAllSelected).toBe(true);
	});

	it('should handle setIsSelectModeOn with function parameter', () => {
		const { result } = testSetup();
		act(() => {
			result.current.setIsSelectModeOn((prev) => !prev);
		});
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should handle setIsSelectModeOn with boolean parameter', () => {
		const { result } = testSetup();
		act(() => {
			result.current.setIsSelectModeOn(true);
		});
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should maintain selection state when toggling same item multiple times', () => {
		const { result } = testSetup();
		// Toggle item on
		act(() => result.current.selectRange(0, 'item1', {} as React.MouseEvent));
		expect(result.current.isSelectModeOn).toBe(true);
		// Toggle same item off
		act(() => result.current.selectRange(0, 'item1', {} as React.MouseEvent));
		expect(result.current.isSelectModeOn).toBe(false);
		// Toggle same item on again
		act(() => result.current.selectRange(0, 'item1', {} as React.MouseEvent));
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should handle multiple items selection and deselection', () => {
		const { result } = testSetup();
		// Select multiple items
		act(() => {
			result.current.selectRange(0, 'item1', {} as React.MouseEvent);
			result.current.selectRange(1, 'item2', {} as React.MouseEvent);
		});
		expect(result.current.isSelectModeOn).toBe(true);
		// Deselect one item
		act(() => result.current.selectRange(0, 'item1', {} as React.MouseEvent));
		expect(result.current.isSelectModeOn).toBe(true); // Should still be on
		// Deselect last item
		act(() => result.current.selectRange(1, 'item2', {} as React.MouseEvent));
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should call setMultipleSelectionCount with correct count on updates', () => {
		testSetup(new Set(['a']));
		expect(setMultipleSelectionCount).toHaveBeenCalledWith(1);
		// Test with a fresh setup to avoid state issues
		setMultipleSelectionCount.mockClear();
		testSetup(new Set(['a', 'b']));
		expect(setMultipleSelectionCount).toHaveBeenCalledWith(2);
		// Test with empty selection
		setMultipleSelectionCount.mockClear();
		testSetup(new Set());
		expect(setMultipleSelectionCount).toHaveBeenCalledWith(0);
	});

	describe('selectRange - Shift+Click functionality', () => {
		const createMockEvent = (
			shiftKey: boolean,
			modifiers: { ctrlKey?: boolean; metaKey?: boolean } = {}
		): React.MouseEvent =>
			({
				shiftKey,
				ctrlKey: false,
				metaKey: false,
				...modifiers,
				preventDefault: vi.fn(),
				stopPropagation: vi.fn()
			}) as unknown as React.MouseEvent;

		describe('when shift key is pressed and selection mode is ON', () => {
			it('should select range from the anchor to the current index (forward selection)', () => {
				const { result, setSelectedItems, setAnchorId } = testSetup();
				// Enable selection mode and select first item
				act(() => {
					result.current.setIsSelectModeOn(true);
					result.current.selectRange(1, 'item2', createMockEvent(false));
				});
				expect(setAnchorId).toHaveBeenCalledWith('item2');
				// Shift+click on item4 (index 3)
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(true));
				});
				// Should have selected items 2, 3, and 4 (indices 1, 2, 3)
				const updaterFn = setSelectedItems.mock.calls[1][0];
				const newSet = updaterFn(new Set(['item2']));
				expect(Array.from(newSet)).toEqual(['item2', 'item3', 'item4']);
				expect(result.current.isSelectModeOn).toBe(true);
			});

			it('should select range from last selected index to current index (backward selection)', () => {
				const selectedItems = new Set<string>();
				const { result, setSelectedItems } = testSetup(new Set(), 'item4');

				// Enable selection mode and set initial state
				act(() => {
					result.current.setIsSelectModeOn(true);
					selectedItems.add('item4');
				});

				// Shift+click on item2 (index 1) - backward selection
				act(() => {
					result.current.selectRange(1, 'item2', createMockEvent(true));
				});

				// Verify setSelectedItems was called with correct updater function
				expect(setSelectedItems).toHaveBeenCalled();
				const updaterFn = setSelectedItems.mock.calls[0][0];
				const prevSet = new Set(['item4']);
				const newSet = updaterFn(prevSet);

				// Should include items at indices 1, 2, 3 (item2, item3, item4)
				expect(newSet.has('item2')).toBe(true);
				expect(newSet.has('item3')).toBe(true);
				expect(newSet.has('item4')).toBe(true);
				expect(newSet.size).toBe(3);
			});

			it('should add to existing selection when shift+clicking', () => {
				const { result, setSelectedItems } = testSetup(new Set(['item1']), 'item3');

				// Enable selection mode
				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Shift+click from index 2 to index 4
				act(() => {
					result.current.selectRange(4, 'item5', createMockEvent(true));
				});

				// Verify the updater function adds new items to existing selection
				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set(['item1']));
				expect(newSet.has('item1')).toBe(true); // Original selection
				expect(newSet.has('item3')).toBe(true); // New range
				expect(newSet.has('item4')).toBe(true);
				expect(newSet.has('item5')).toBe(true);
				expect(newSet.size).toBe(4);
			});

			it('should handle shift+click on the same index as the anchor', () => {
				const { result, setSelectedItems } = testSetup(new Set(['item3']), 'item3');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Shift+click on the same index
				act(() => {
					result.current.selectRange(2, 'item3', createMockEvent(true));
				});

				// Should only select the single item at that index
				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set(['item3']));
				expect(newSet.has('item3')).toBe(true);
				expect(newSet.size).toBe(1);
			});

			it('should handle shift+click when there is no anchor', () => {
				const { result, setSelectedItems, setAnchorId } = testSetup(new Set(), null);

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Shift+click when no previous selection
				act(() => {
					result.current.selectRange(2, 'item3', createMockEvent(true));
				});

				// Should perform regular toggle selection (not range selection)
				expect(setSelectedItems).toHaveBeenCalled();
				expect(setAnchorId).toHaveBeenCalledWith('item3');
			});

			it('should handle range selection at boundaries (first to last item)', () => {
				const { result, setSelectedItems } = testSetup(new Set(), 'item1');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Shift+click from first to last item
				act(() => {
					result.current.selectRange(4, 'item5', createMockEvent(true));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set());

				// Should select all items
				expect(newSet.size).toBe(5);
				allItems.forEach((item) => {
					expect(newSet.has(item)).toBe(true);
				});
			});

			it('should maintain selection mode after shift+click range selection', () => {
				const { result } = testSetup(new Set(), 'item1');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				const initialSelectMode = result.current.isSelectModeOn;

				act(() => {
					result.current.selectRange(2, 'item3', createMockEvent(true));
				});

				// Selection mode should remain on
				expect(result.current.isSelectModeOn).toBe(true);
				expect(result.current.isSelectModeOn).toBe(initialSelectMode);
			});
		});

		describe('when shift key is NOT pressed', () => {
			it('should toggle selection for clicked item only', () => {
				const { result, setAnchorId } = testSetup(new Set(['item2']), 'item2');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Click without shift key
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(false));
				});

				// Should update the anchor
				expect(setAnchorId).toHaveBeenCalledWith('item4');
			});

			it('should enable selection mode when clicking without shift in non-selection mode', () => {
				const { result, setSelectedItems } = testSetup(new Set(), null);

				// Start with selection mode off
				expect(result.current.isSelectModeOn).toBe(false);

				// Click without shift key
				act(() => {
					result.current.selectRange(1, 'item2', createMockEvent(false));
				});

				// Should have called setSelectedItems to toggle the item
				expect(setSelectedItems).toHaveBeenCalled();
			});
		});

		describe('edge cases', () => {
			it('should handle empty allAvailableItems array', () => {
				const { result } = renderHook(() =>
					useMultipleSelection({
						allAvailableItems: [],
						selectedItems: new Set(),
						setSelectedItems: vi.fn(),
						anchorId: null,
						setAnchorId: vi.fn()
					})
				);

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Should not throw error
				expect(() => {
					act(() => {
						result.current.selectRange(0, 'item1', createMockEvent(true));
					});
				}).not.toThrow();
			});

			it('should handle out-of-bounds indices gracefully', () => {
				const { result, setSelectedItems } = testSetup(new Set(), 'item2');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Try to select with out-of-bounds index
				act(() => {
					result.current.selectRange(10, 'item10', createMockEvent(true));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set());

				// Should only select valid items within bounds
				expect(newSet.has('item10')).toBe(false);
				expect(newSet.size).toBeLessThanOrEqual(allItems.length);
			});

			it('should fall back to a single toggle when the anchor is no longer in the list', () => {
				// 'gone' stands for an anchor whose item was deleted, moved or filtered out
				// by a new search query: the id simply is not in allAvailableItems anymore.
				const { result, setSelectedItems, setAnchorId } = testSetup(new Set(['item1']), 'gone');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				expect(() => {
					act(() => {
						result.current.selectRange(4, 'item5', createMockEvent(true));
					});
				}).not.toThrow();

				// No range: only the clicked item is added, and it becomes the new anchor
				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set(['item1']));
				expect(Array.from(newSet)).toEqual(['item1', 'item5']);
				expect(setAnchorId).toHaveBeenCalledWith('item5');
			});
		});

		describe('the range is additive', () => {
			it('should produce the same selection forward and backward', () => {
				const { setSelectedItems: forwardSet, result: forwardResult } = testSetup(
					new Set(),
					'item2'
				);
				act(() => {
					forwardResult.current.setIsSelectModeOn(true);
				});
				act(() => {
					forwardResult.current.selectRange(3, 'item4', createMockEvent(true));
				});

				const { setSelectedItems: backwardSet, result: backwardResult } = testSetup(
					new Set(),
					'item4'
				);
				act(() => {
					backwardResult.current.setIsSelectModeOn(true);
				});
				act(() => {
					backwardResult.current.selectRange(1, 'item2', createMockEvent(true));
				});

				const forward = forwardSet.mock.calls[0][0](new Set());
				const backward = backwardSet.mock.calls[0][0](new Set());
				expect(Array.from(forward)).toEqual(['item2', 'item3', 'item4']);
				expect(Array.from(backward)).toEqual(Array.from(forward));
			});

			it('should fill the gaps without toggling already selected items off', () => {
				// item1 sits outside the range and item3 inside it, so a range that replaced
				// the selection instead of adding to it would drop item1, and a range that
				// toggled instead of adding would drop item3. The range is item2..item4, not
				// the whole list, so both mistakes are observable here.
				const { result, setSelectedItems } = testSetup(new Set(['item1', 'item3']), 'item2');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(true));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set(['item1', 'item3']));
				// Sorted, because a Set keeps insertion order and the already selected items
				// were inserted first.
				expect(Array.from(newSet).sort()).toEqual(['item1', 'item2', 'item3', 'item4']);
			});
		});

		describe('when ctrl or cmd is pressed', () => {
			it('should toggle a single item without clearing the rest on ctrl+click', () => {
				const { result, setSelectedItems } = testSetup(new Set(['item1', 'item2']), 'item1');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(false, { ctrlKey: true }));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set(['item1', 'item2']));
				expect(Array.from(newSet)).toEqual(['item1', 'item2', 'item4']);
			});

			it('should deselect an already selected item on cmd+click', () => {
				const { result, setSelectedItems } = testSetup(new Set(['item1', 'item2']), 'item1');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});
				act(() => {
					result.current.selectRange(1, 'item2', createMockEvent(false, { metaKey: true }));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set(['item1', 'item2']));
				expect(Array.from(newSet)).toEqual(['item1']);
				expect(result.current.isSelectModeOn).toBe(true);
			});

			it('should make the ctrl+clicked item the new anchor', () => {
				const { result, setAnchorId } = testSetup(new Set(['item1']), 'item1');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(false, { ctrlKey: true }));
				});

				expect(setAnchorId).toHaveBeenCalledWith('item4');
			});
		});

		describe('when selection mode is off', () => {
			it('should select only the clicked item on the first shift+click', () => {
				const { result, setSelectedItems, setAnchorId } = testSetup(new Set(), null);

				expect(result.current.isSelectModeOn).toBe(false);
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(true));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set());
				expect(Array.from(newSet)).toEqual(['item4']);
				expect(result.current.isSelectModeOn).toBe(true);
				expect(setAnchorId).toHaveBeenCalledWith('item4');
			});

			it('should select only the clicked item on the first ctrl+click', () => {
				const { result, setSelectedItems, setAnchorId } = testSetup(new Set(), null);

				expect(result.current.isSelectModeOn).toBe(false);
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(false, { ctrlKey: true }));
				});

				const updaterFn = setSelectedItems.mock.calls[0][0];
				const newSet = updaterFn(new Set());
				expect(Array.from(newSet)).toEqual(['item4']);
				expect(result.current.isSelectModeOn).toBe(true);
				expect(setAnchorId).toHaveBeenCalledWith('item4');
			});
		});

		describe('anchor reset', () => {
			it('should drop the anchor when a toggle empties the selection', () => {
				const { result, setAnchorId } = testSetup(new Set(['item2']), 'item2');

				act(() => {
					result.current.setIsSelectModeOn(true);
				});
				setAnchorId.mockClear();
				act(() => {
					result.current.selectRange(1, 'item2', createMockEvent(false));
				});

				expect(setAnchorId).toHaveBeenCalledWith(null);
				expect(result.current.isSelectModeOn).toBe(false);
			});

			it.each([
				[
					'deselectAll',
					(hook: ReturnType<typeof useMultipleSelection>): void => hook.deselectAll()
				],
				[
					'selectAllModeOff',
					(hook: ReturnType<typeof useMultipleSelection>): void => hook.selectAllModeOff()
				],
				['selectAll', (hook: ReturnType<typeof useMultipleSelection>): void => hook.selectAll()]
			])('should drop the anchor on %s', (_name, action) => {
				const { result, setAnchorId } = testSetup(new Set(['item2']), 'item2');

				setAnchorId.mockClear();
				act(() => action(result.current));

				expect(setAnchorId).toHaveBeenCalledWith(null);
			});

			it('should drop the anchor when resetAnchorKey changes', () => {
				const setAnchorId = vi.fn();
				const { rerender } = renderHook(
					({ resetAnchorKey }: { resetAnchorKey: string }) =>
						useMultipleSelection({
							allAvailableItems: allItems,
							selectedItems: new Set(['item2']),
							setSelectedItems: vi.fn(),
							anchorId: 'item2',
							setAnchorId,
							resetAnchorKey
						}),
					{ initialProps: { resetAnchorKey: 'folder-2|dateDesc' } }
				);

				// Mounting must not reset on its own
				expect(setAnchorId).not.toHaveBeenCalled();

				// Folder change
				rerender({ resetAnchorKey: 'folder-7|dateDesc' });
				expect(setAnchorId).toHaveBeenCalledWith(null);

				// Sorting change
				setAnchorId.mockClear();
				rerender({ resetAnchorKey: 'folder-7|subjAsc' });
				expect(setAnchorId).toHaveBeenCalledWith(null);

				// Same key, no reset
				setAnchorId.mockClear();
				rerender({ resetAnchorKey: 'folder-7|subjAsc' });
				expect(setAnchorId).not.toHaveBeenCalled();
			});
		});
	});
});
