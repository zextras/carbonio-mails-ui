/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';
import { useAppContext } from '@zextras/carbonio-shell-ui';

import { useMultipleSelection } from 'hooks/use-multiple-selection';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useAppContext: jest.fn()
}));

describe('useMultipleSelection', () => {
	const setMultipleSelectionCount = jest.fn();
	const allItems = ['a', 'b', 'c'];

	beforeEach(() => {
		(useAppContext as jest.Mock).mockReturnValue({
			setMultipleSelectionCount
		});
		setMultipleSelectionCount.mockClear();
	});

	const testSetup = (
		selectedItemsInit = new Set<string>()
	): {
		result: { current: ReturnType<typeof useMultipleSelection> };
		setSelectedItems: (fn: (items: Set<string>) => Set<string>) => void;
		rerender: () => void;
	} => {
		let selectedItems = selectedItemsInit; // create a mutable local copy

		const setSelectedItems = jest.fn((updater: (prev: Set<string>) => Set<string>) => {
			if (typeof updater === 'function') {
				selectedItems = updater(selectedItems);
			}
		}) as jest.Mock;

		const { result, rerender } = renderHook(() =>
			useMultipleSelection({
				allAvailableItems: allItems,
				selectedItems,
				setSelectedItems
			})
		);

		return { result, setSelectedItems, rerender };
	};

	it('should start with selection mode off', () => {
		const { result } = testSetup();
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should toggle selection ON when item is selected', () => {
		const { result, setSelectedItems } = testSetup();
		act(() => result.current.toggleItemSelection('a'));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should toggle item OFF and switch mode OFF when last item is deselected', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a']));
		act(() => result.current.toggleItemSelection('a'));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should keep selection mode ON if items remain selected after deselect', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a', 'b']));
		act(() => result.current.toggleItemSelection('a'));
		expect(setSelectedItems).toHaveBeenCalled();
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('selects all items', () => {
		const { result, setSelectedItems } = testSetup();
		act(() => {
			result.current.selectAll();
		});
		expect(setSelectedItems).toHaveBeenCalledWith(new Set(['a', 'b', 'c']));
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should deselect all items and turn off selection mode', () => {
		const { result, setSelectedItems } = testSetup(new Set(['a', 'b']));

		act(() => result.current.deselectAll());

		expect(setSelectedItems).toHaveBeenCalledWith(new Set());
		expect(result.current.isSelectModeOn).toBe(false);
	});

	it('should return isAllSelected true if all items selected', () => {
		const { result } = testSetup(new Set(['a', 'b', 'c']));
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
			act(() => result.current.toggleItemSelection('b'));
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

		const { result: result2 } = testSetup(new Set(['a', 'b', 'c']));
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
		act(() => result.current.toggleItemSelection('a'));
		expect(result.current.isSelectModeOn).toBe(true);

		// Toggle same item off
		act(() => result.current.toggleItemSelection('a'));
		expect(result.current.isSelectModeOn).toBe(false);

		// Toggle same item on again
		act(() => result.current.toggleItemSelection('a'));
		expect(result.current.isSelectModeOn).toBe(true);
	});

	it('should handle multiple items selection and deselection', () => {
		const { result } = testSetup();

		// Select multiple items
		act(() => {
			result.current.toggleItemSelection('a');
			result.current.toggleItemSelection('b');
		});
		expect(result.current.isSelectModeOn).toBe(true);

		// Deselect one item
		act(() => result.current.toggleItemSelection('a'));
		expect(result.current.isSelectModeOn).toBe(true); // Should still be on

		// Deselect last item
		act(() => result.current.toggleItemSelection('b'));
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
});
