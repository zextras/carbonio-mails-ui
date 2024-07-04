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
	test('should render outer container correctly', async () => {
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
	test('should render inner container correctly', async () => {
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
	test('should render folderView correctly', async () => {
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
	test('should render detailPanel correctly', async () => {
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
	test('The width of the outer container is 100%', async () => {
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
	test('The height of the outer container is vertical', async () => {
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
	test('By default the orientation of the outer container is vertical', async () => {
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
	test('If the layout is left to right the orientation of the outer container is vertical', async () => {
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
	test('If the layout is top to bottom the orientation of the outer container is horizontal', async () => {
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
	test('By default the inner container has height 100%', async () => {
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
	test('By default the inner container has width 60%', async () => {
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
	test('If the orientation is vertical the width of the inner container is 60%', () => {
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
	test('If the orientation is vertical the height of the inner container is 100%', () => {
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
	test('If the orientation is horizontal the width of the inner container is 100%', () => {
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
	test('If the orientation is horizontal the height of the inner container is 50%', () => {
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

		expect(component).toHaveStyle({ height: '50%' });
	});
	test('The mails view height depends from the stored value', async () => {
		const ref = { current: null };

		useLocalStorage.mockImplementation((key: string) => [
			key === LOCAL_STORAGE_VIEW_SIZES
				? { width: '500', height: '800' }
				: MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
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

		expect(component).toHaveStyle({ height: '800px' });
	});
	test('The mails view width depends from the stored value', async () => {
		const ref = { current: null };

		useLocalStorage.mockImplementation((key: string) => [
			key === LOCAL_STORAGE_VIEW_SIZES
				? { width: '500', height: '800' }
				: MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT,
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
});
