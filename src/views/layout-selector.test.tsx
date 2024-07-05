/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { LayoutSelector } from './layout-selector';
import { useLocalStorage } from '../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { screen, setupTest } from '../carbonio-ui-commons/test/test-setup';
import { LOCAL_STORAGE_VIEW_SIZES, MAILS_VIEW_LAYOUTS } from '../constants';

const MockedView = ({ id = '0' }: { id?: string }): React.JSX.Element => (
	<div data-testid={`MockedView${id}`} />
);

const SELECTORS = {
	OUTER: 'LayoutSelectorOuterContainer',
	INNER: 'LayoutSelectorInnerContainer'
};

describe('LayoutSelector', () => {
	describe('It should render all of its parts', () => {
		test('outer container', async () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const layoutSelectorComponent = screen.getByTestId(SELECTORS.OUTER);
			expect(layoutSelectorComponent).toBeVisible();
		});
		test('inner container', async () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const layoutSelectorComponent = screen.getByTestId(SELECTORS.INNER);
			expect(layoutSelectorComponent).toBeVisible();
		});
		test('folderView', async () => {
			const ref = { current: null };
			const id = '1';

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView id={id} />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const folderView = screen.getByTestId(`MockedView${id}`);
			expect(folderView).toBeVisible();
		});
		test('detailPanel', async () => {
			const ref = { current: null };
			const id = '1';

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView id={id} />}
					containerRef={ref}
				/>
			);
			const detailPanel = screen.getByTestId(`MockedView${id}`);
			expect(detailPanel).toBeVisible();
		});
	});
	test('The outer container has a width set', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.OUTER);

		expect(component).toHaveStyle({ width: '100%' });
	});
	test('The outer container has a height set', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.OUTER);

		expect(component).toHaveStyle({ height: '100%' });
	});
	test('The inner container has a minWidth set', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.INNER);

		expect(component).toHaveStyle({ minWidth: '22.5rem' });
	});
	test('The inner container has a minHeight set', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.INNER);

		expect(component).toHaveStyle({ minHeight: '11.25rem' });
	});
	test('The inner container has the attribute flex shrink to 0 to properly resize following the cursor icon', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.INNER);

		expect(component).toHaveStyle({ flexShrink: 0 });
	});
	describe('If the orientation is left to right', () => {
		test('the outer container orientation value is row', async () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.OUTER);

			expect(component).toHaveAttribute('orientation', 'row');
		});
		test('and there is not a stored value, the mails width is 60%', () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).toHaveStyle({ width: '60%' });
		});
		test('and there is a stored value, the mails view width is equal to that value', async () => {
			const ref = { current: null };

			useLocalStorage.mockImplementation((key: string) => [
				key === LOCAL_STORAGE_VIEW_SIZES ? { width: '500' } : MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
				jest.fn()
			]);

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).toHaveStyle({ width: '500px' });
		});
		test('the height of the inner container is 100%', () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).toHaveStyle({ height: '100%' });
		});
		test('the height of the inner container wont depend from the stored value', () => {
			const ref = { current: null };

			useLocalStorage.mockImplementation((key: string) => [
				key === LOCAL_STORAGE_VIEW_SIZES ? { height: '500' } : MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
				jest.fn()
			]);

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).not.toHaveStyle({ height: '500px' });
		});
	});

	describe('If the orientation is top to bottom', () => {
		test('the outer container orientation value is column', async () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.OUTER);

			expect(component).toHaveAttribute('orientation', 'column');
		});
		test('and there is not a stored value, the height is 50%', () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).toHaveStyle({ width: '100%' });
		});
		test('and there is a stored value, the mails view height is equal to that value', () => {
			const ref = { current: null };

			useLocalStorage.mockImplementation((key: string) => [
				key === LOCAL_STORAGE_VIEW_SIZES ? { height: '500' } : MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
				jest.fn()
			]);

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).toHaveStyle({ height: '500px' });
		});
		test('the width of the inner container is 100%', () => {
			const ref = { current: null };

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).toHaveStyle({ width: '100%' });
		});
		test('the width of the inner container wont depend from the stored value', () => {
			const ref = { current: null };

			useLocalStorage.mockImplementation((key: string) => [
				key === LOCAL_STORAGE_VIEW_SIZES ? { width: '500' } : MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
				jest.fn()
			]);

			setupTest(
				<LayoutSelector
					listLayout={MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM}
					folderView={<MockedView />}
					detailPanel={<MockedView />}
					containerRef={ref}
				/>
			);
			const component = screen.getByTestId(SELECTORS.INNER);

			expect(component).not.toHaveStyle({ width: '500px' });
		});
	});
});
