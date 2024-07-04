/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { LayoutSelector } from './layout-selector';
import { screen, setupTest } from '../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS } from '../constants';

const MockedView = ({ id }: { id?: string }): React.JSX.Element => (
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
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
				listLayout={MAILS_VIEW_LAYOUTS.DEFAULT}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.OUTER);

		expect(component).toHaveAttribute('orientation', 'column');
	});
	test('If the layout is vertical the orientation of the outer container is vertical', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.VERTICAL}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.OUTER);

		expect(component).toHaveAttribute('orientation', 'column');
	});
	test('If the layout is horizontal the orientation of the outer container is horizontal', async () => {
		const ref = { current: null };

		setupTest(
			<LayoutSelector
				listLayout={MAILS_VIEW_LAYOUTS.HORIZONTAL}
				folderView={<MockedView />}
				detailPanel={<MockedView />}
				containerRef={ref}
			/>
		);
		const component = screen.getByTestId(SELECTORS.OUTER);

		expect(component).toHaveAttribute('orientation', 'row');
	});
});
