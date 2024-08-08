/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../constants';
import { mockLayoutStorage } from '../../tests/layouts-utils';
import { useViewLayout } from '../use-view-layout';

describe('useViewLayout', () => {
	it('should return an object with proper fields', () => {
		const {
			result: { current }
		} = setupHook(useViewLayout);

		expect(current).toEqual({
			currentLayout: expect.anything(),
			setCurrentLayout: expect.anything(),
			splitLayoutOrientation: expect.anything(),
			setSplitLayoutOrientation: expect.anything(),
			splitSeparatorDimensions: expect.anything(),
			setSplitSeparatorDimensions: expect.anything(),
			isCurrentLayoutSplit: expect.anything(),
			isCurrentLayoutVerticalSplit: expect.anything(),
			isCurrentLayoutHorizontalSplit: expect.anything(),
			isCurrentLayoutNoSplit: expect.anything()
		});
	});

	describe('currentLayout', () => {
		it('should return the value stored in the local storage', () => {
			const layout = MAILS_VIEW_LAYOUTS.NO_SPLIT;
			mockLayoutStorage({ layout });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.currentLayout).toEqual(layout);
		});
	});

	describe('setCurrentLayout', () => {
		it('should store the value in the local storage', () => {
			const layout = MAILS_VIEW_LAYOUTS.NO_SPLIT;
			const setter = jest.fn();
			mockLayoutStorage({ callback: setter });

			const {
				result: { current }
			} = setupHook(useViewLayout);
			current.setCurrentLayout(layout);

			expect(setter).toHaveBeenCalledWith(layout);
		});
	});

	describe('splitLayoutOrientation', () => {
		it('should return the value stored in the local storage', () => {
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL;
			mockLayoutStorage({ splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.splitLayoutOrientation).toEqual(orientation);
		});
	});

	describe('setSplitLayoutOrientation', () => {
		it('should store the value in the local storage', () => {
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL;
			const setter = jest.fn();
			mockLayoutStorage({ callback: setter });

			const {
				result: { current }
			} = setupHook(useViewLayout);
			current.setSplitLayoutOrientation(orientation);

			expect(setter).toHaveBeenCalledWith(orientation);
		});
	});

	describe('isCurrentLayoutSplit', () => {
		it('should contain false if the current layout is "no-split"', () => {
			const layout = MAILS_VIEW_LAYOUTS.NO_SPLIT;
			mockLayoutStorage({ layout });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutSplit).toEqual(false);
		});

		it('should contain true if the current layout is "split" and the orientation is horizontal', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL;
			mockLayoutStorage({ layout, splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutSplit).toEqual(true);
		});

		it('should contain true if the current layout is "split" and the orientation is vertical', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL;
			mockLayoutStorage({ layout, splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutSplit).toEqual(true);
		});
	});

	describe('isCurrentLayoutVerticalSplit', () => {
		it('should contain false if the current layout is "no-split"', () => {
			const layout = MAILS_VIEW_LAYOUTS.NO_SPLIT;
			mockLayoutStorage({ layout });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutVerticalSplit).toEqual(false);
		});

		it('should contain false if the current layout is "split" and the orientation is horizontal', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL;
			mockLayoutStorage({ layout, splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutVerticalSplit).toEqual(false);
		});

		it('should contain true if the current layout is "split" and the orientation is vertical', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL;
			mockLayoutStorage({ layout, splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutVerticalSplit).toEqual(true);
		});
	});

	describe('isCurrentLayoutHorizontalSplit', () => {
		it('should contain false if the current layout is "no-split"', () => {
			const layout = MAILS_VIEW_LAYOUTS.NO_SPLIT;
			mockLayoutStorage({ layout });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutHorizontalSplit).toEqual(false);
		});

		it('should contain false if the current layout is "split" and the orientation is vertical', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL;
			mockLayoutStorage({ layout, splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutHorizontalSplit).toEqual(false);
		});

		it('should contain true if the current layout is "split" and the orientation is horizontal', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			const orientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL;
			mockLayoutStorage({ layout, splitOrientation: orientation });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutHorizontalSplit).toEqual(true);
		});
	});

	describe('isCurrentLayoutNoSplit', () => {
		it('should contain false if the current layout is "split"', () => {
			const layout = MAILS_VIEW_LAYOUTS.SPLIT;
			mockLayoutStorage({ layout });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutNoSplit).toEqual(false);
		});

		it('should contain true if the current layout is "no-split"', () => {
			const layout = MAILS_VIEW_LAYOUTS.NO_SPLIT;
			mockLayoutStorage({ layout });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.isCurrentLayoutNoSplit).toEqual(true);
		});
	});

	describe('splitSeparatorDimensions', () => {
		it('should return the value stored in the local storage', () => {
			const dimensions = {
				top: faker.number.int({ max: 5000 }),
				left: faker.number.int({ max: 5000 }),
				width: faker.number.int({ max: 5000 }),
				height: faker.number.int({ max: 5000 })
			};
			mockLayoutStorage({ ...dimensions });

			const {
				result: { current }
			} = setupHook(useViewLayout);

			expect(current.splitSeparatorDimensions).toEqual(dimensions);
		});
	});

	describe('setSplitSeparatorDimensions', () => {
		it('should store the value in the local storage', () => {
			const dimensions = {
				top: faker.number.int({ max: 5000 }),
				left: faker.number.int({ max: 5000 }),
				width: faker.number.int({ max: 5000 }),
				height: faker.number.int({ max: 5000 })
			};
			const setter = jest.fn();
			mockLayoutStorage({ callback: setter });

			const {
				result: { current }
			} = setupHook(useViewLayout);
			current.setSplitSeparatorDimensions(dimensions);

			expect(setter).toHaveBeenCalledWith(dimensions);
		});
	});
});
