/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useTagStore, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { useTagPillItems } from 'hooks/use-tag-pill-items';

const FINANCE = 'nil:Finance';

describe('useTagPillItems', () => {
	beforeEach(() => {
		useTagStore.setState({
			tags: {
				1: { id: '1', name: 'urgent', color: 5 },
				2: { id: '2', name: 'Client', color: 1 },
				3: { id: '3', name: 'board', rgb: '#1b1f3b' }
			}
		});
	});

	it('returns the tags of the item in alphabetical order, ignoring case', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['1', '2', '3']] });

		expect(result.current.map((item) => item.name)).toEqual(['board', 'Client', 'urgent']);
	});

	it('gives each tag its colour, the custom rgb first', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['1', '3']] });

		expect(result.current).toEqual([
			{ id: '3', name: 'board', color: '#1b1f3b' },
			{ id: '1', name: 'urgent', color: ZIMBRA_STANDARD_COLORS[5].hex }
		]);
	});

	it('shows the tags set by the owner of a shared folder last, as shared tags', () => {
		const { result } = setupHook(useTagPillItems, {
			initialProps: [[FINANCE, '1', 'nil:Accounting']]
		});

		expect(result.current).toEqual([
			{ id: '1', name: 'urgent', color: ZIMBRA_STANDARD_COLORS[5].hex },
			{ id: 'nil:Accounting', name: 'Accounting', shared: true },
			{ id: FINANCE, name: 'Finance', shared: true }
		]);
	});

	it('keeps the shared tags when the user has no tags of their own', () => {
		useTagStore.setState({ tags: {} });

		const { result } = setupHook(useTagPillItems, { initialProps: [[FINANCE]] });

		expect(result.current).toEqual([{ id: FINANCE, name: 'Finance', shared: true }]);
	});

	it('keeps a colon in the name of a shared tag', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['nil:Q1: plan']] });

		expect(result.current[0].name).toBe('Q1: plan');
	});

	it('skips empty and unknown ids and repeated tags', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['', '99', '2', '2']] });

		expect(result.current.map((item) => item.id)).toEqual(['2']);
	});

	it('returns no tags for an item without tags', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [undefined] });

		expect(result.current).toEqual([]);
	});
});
