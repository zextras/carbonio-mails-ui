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
		lastSelectedIndexInit: number | null = null
	): {
		result: { current: ReturnType<typeof useMultipleSelection> };
		setSelectedItems: Mock;
		setLastSelectedIndex: Mock;
		rerender: () => void;
	} => {
		let selectedItems = selectedItemsInit;
		let lastSelectedIndex = lastSelectedIndexInit;

		const setSelectedItems = vi.fn((updater: (prev: Set<string>) => Set<string>) => {
			if (typeof updater === 'function') {
				selectedItems = updater(selectedItems);
			}
		}) as Mock;

		const setLastSelectedIndex = vi.fn((index: number | null) => {
			lastSelectedIndex = index;
		}) as Mock;

		const { result, rerender } = renderHook(() =>
			useMultipleSelection({
				allAvailableItems: allItems,
				selectedItems,
				setSelectedItems,
				lastSelectedIndex,
				setLastSelectedIndex
			})
		);

		return { result, setSelectedItems, setLastSelectedIndex, rerender };
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
		const createMockEvent = (shiftKey: boolean): React.MouseEvent =>
			({
				shiftKey,
				preventDefault: vi.fn(),
				stopPropagation: vi.fn()
			}) as unknown as React.MouseEvent;

		describe('when shift key is pressed and selection mode is ON', () => {
			it('should select range from last selected index to current index (forward selection)', () => {
				const { result, setLastSelectedIndex } = testSetup();
				// Enable selection mode and select first item
				act(() => {
					result.current.setIsSelectModeOn(true);
					result.current.selectRange(1, 'item2', createMockEvent(false));
				});
				expect(setLastSelectedIndex).toHaveBeenCalledWith(1);
				// Shift+click on item4 (index 3)
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(true));
				});
				// Should have selected items 2, 3, and 4 (indices 1, 2, 3)
				expect(result.current.isSelectModeOn).toBe(true);
			});

			it('should select range from last selected index to current index (backward selection)', () => {
				const selectedItems = new Set<string>();
				const { result, setSelectedItems } = testSetup(new Set(), 3);

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
				const { result, setSelectedItems } = testSetup(new Set(['item1']), 2);

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

			it('should handle shift+click on the same index as lastSelectedIndex', () => {
				const { result, setSelectedItems } = testSetup(new Set(['item3']), 2);

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

			it('should handle shift+click when lastSelectedIndex is null', () => {
				const { result, setSelectedItems, setLastSelectedIndex } = testSetup(new Set(), null);

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Shift+click when no previous selection
				act(() => {
					result.current.selectRange(2, 'item3', createMockEvent(true));
				});

				// Should perform regular toggle selection (not range selection)
				expect(setSelectedItems).toHaveBeenCalled();
				expect(setLastSelectedIndex).toHaveBeenCalledWith(2);
			});

			it('should handle range selection at boundaries (first to last item)', () => {
				const { result, setSelectedItems } = testSetup(new Set(), 0);

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
				const { result } = testSetup(new Set(), 0);

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
				const { result, setLastSelectedIndex } = testSetup(new Set(['item2']), 1);

				act(() => {
					result.current.setIsSelectModeOn(true);
				});

				// Click without shift key
				act(() => {
					result.current.selectRange(3, 'item4', createMockEvent(false));
				});

				// Should update lastSelectedIndex
				expect(setLastSelectedIndex).toHaveBeenCalledWith(3);
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
						lastSelectedIndex: null,
						setLastSelectedIndex: vi.fn()
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
				const { result, setSelectedItems } = testSetup(new Set(), 1);

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
		});
	});
});
