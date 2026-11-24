/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { TagPillItem } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { fitTagsInLines } from 'views/app/detail-panel/preview/parts/tags/fit-tags-in-lines';
import {
	ReadingPaneTags,
	ReadingPaneTagsProps
} from 'views/app/detail-panel/preview/parts/tags/reading-pane-tags';

// jsdom has no layout: the fit is tested on its own, here it says how many tags are shown.
vi.mock('views/app/detail-panel/preview/parts/tags/fit-tags-in-lines', async () => {
	const actual = await vi.importActual<
		typeof import('views/app/detail-panel/preview/parts/tags/fit-tags-in-lines')
	>('views/app/detail-panel/preview/parts/tags/fit-tags-in-lines');
	return { ...actual, fitTagsInLines: vi.fn() };
});
const mockedFit = vi.mocked(fitTagsInLines);
const showAll = (): void => {
	mockedFit.mockImplementation(({ pillWidths }) => pillWidths.length);
};
const showFirst = (count: number): void => {
	mockedFit.mockImplementation(({ pillWidths }) => Math.min(count, pillWidths.length));
};

const tag = (id: string, name: string, color = '#2b73d2'): TagPillItem => ({ id, name, color });
const client = tag('1', 'Client');
const escalation = tag('2', 'Customer escalation', '#ff7043');
const partners = tag('3', 'Partners', '#edaeab');
const project = tag('4', 'Project', '#66bb6a');
const Q4_RENEWAL = 'Q4 renewal';
const renewal = tag('5', Q4_RENEWAL, '#29b6f6');
const urgent = tag('6', 'Urgent', '#ef5350');
const allSix = [client, escalation, partners, project, renewal, urgent];

const setup = (
	props: Partial<ReadingPaneTagsProps> = {}
): ReturnType<typeof setupTest> & {
	rerenderWith: (next: Partial<ReadingPaneTagsProps>) => void;
} => {
	const base: ReadingPaneTagsProps = {
		tags: allSix,
		onSearch: vi.fn(),
		onRemove: vi.fn(),
		...props
	};
	const result = setupTest(<ReadingPaneTags {...base} />);
	return {
		...result,
		rerenderWith: (next): void => result.rerender(<ReadingPaneTags {...base} {...next} />)
	};
};

/** The pills shown: buttons named by their tag, not their "×" or "+N" (the measuring copies are hidden). */
const pillNames = (): Array<string> =>
	screen
		.getAllByRole('button')
		.map((button) => button.textContent ?? '')
		.filter((name) => name !== '' && !name.startsWith('+'));

const SHOW_3 = 'Show 3 more tags';
const MORE_3 = '3 more tags';
const SHOW_1 = 'Show 1 more tag';
const REMOVE_PROJECT = 'Remove tag Project';
const REMOVE_URGENT = 'Remove tag Urgent';
const CUSTOMER_ESCALATION = 'Customer escalation';
const REMOVE_RENEWAL = 'Remove tag Q4 renewal';

describe('ReadingPaneTags', () => {
	beforeEach(() => showAll());

	describe('pills', () => {
		test('shows every tag when they fit in two lines, without "+N"', () => {
			setup();
			expect(pillNames()).toEqual(allSix.map((item) => item.name));
			expect(screen.queryByRole('button', { name: /more tag/ })).not.toBeInTheDocument();
		});

		test('a click on a pill searches by its tag', async () => {
			const onSearch = vi.fn();
			const { user } = setup({ onSearch });
			await user.click(screen.getByRole('button', { name: 'Client' }));
			expect(onSearch).toHaveBeenCalledWith(client);
		});

		test('the "×" of a pill removes its tag', async () => {
			const onRemove = vi.fn();
			const { user } = setup({ onRemove });
			await user.click(screen.getByRole('button', { name: REMOVE_URGENT }));
			expect(onRemove).toHaveBeenCalledWith(urgent, expect.anything());
		});

		test('the "×" uses the given accessible name', () => {
			setup({ removeLabel: (item) => `Remove tag ${item.name} from conversation` });
			expect(
				screen.getByRole('button', { name: 'Remove tag Client from conversation' })
			).toBeInTheDocument();
		});

		test('without onRemove there is no "×"', () => {
			setup({ onRemove: undefined });
			expect(screen.queryByRole('button', { name: /Remove tag/ })).not.toBeInTheDocument();
		});

		test('a tag from a shared folder can be neither clicked nor removed', () => {
			setup({ tags: [{ id: 'nil:Finance', name: 'Finance', shared: true }] });
			expect(screen.queryByRole('button', { name: 'Finance' })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /Remove tag/ })).not.toBeInTheDocument();
		});

		test('after a removal the focus goes to the next pill', async () => {
			const { user, rerenderWith } = setup({ tags: [client, project, urgent] });
			await user.click(screen.getByRole('button', { name: REMOVE_PROJECT }));
			rerenderWith({ tags: [client, urgent] });
			expect(screen.getByRole('button', { name: 'Urgent' })).toHaveFocus();
		});

		test('a render before the tag goes does not move the focus too early', async () => {
			const { user, rerenderWith } = setup({ tags: [client, project, urgent] });
			await user.click(screen.getByRole('button', { name: REMOVE_PROJECT }));
			// The store renders again before the removal reaches the tags
			rerenderWith({ tags: [client, project, urgent] });
			rerenderWith({ tags: [client, urgent] });
			expect(screen.getByRole('button', { name: 'Urgent' })).toHaveFocus();
		});

		test('after removing the last pill the focus goes to the previous one', async () => {
			const { user, rerenderWith } = setup({ tags: [client, urgent] });
			await user.click(screen.getByRole('button', { name: REMOVE_URGENT }));
			rerenderWith({ tags: [client] });
			expect(screen.getByRole('button', { name: 'Client' })).toHaveFocus();
		});
	});

	describe('"+N"', () => {
		test('when the tags need more than two lines, the rest becomes a "+N" button', () => {
			showFirst(3);
			setup();
			expect(pillNames()).toEqual(['Client', CUSTOMER_ESCALATION, 'Partners']);
			const more = screen.getByRole('button', { name: SHOW_3 });
			expect(more).toHaveTextContent('+3');
		});

		test('a click opens the hidden tags with their "×", focus on the first "×"', async () => {
			showFirst(3);
			const { user } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			const card = screen.getByRole('dialog', { name: MORE_3 });
			expect(within(card).getByText('Project')).toBeVisible();
			expect(within(card).getByText(Q4_RENEWAL)).toBeVisible();
			expect(within(card).getByText('Urgent')).toBeVisible();
			expect(within(card).getByRole('button', { name: REMOVE_PROJECT })).toHaveFocus();
		});

		test('a hidden tag from a shared folder shows its name, whose folder in the tooltip', async () => {
			showFirst(1);
			const finance: TagPillItem = {
				id: 'nil:Finance',
				name: 'Finance',
				shared: true,
				tooltip: 'Finance · Tag from a shared folder'
			};
			const { user } = setup({ tags: [client, finance] });
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			const row = within(screen.getByRole('dialog')).getByTestId('hidden-tag-row');
			expect(row).toHaveTextContent('Finance');
			expect(row).not.toHaveTextContent('Tag from a shared folder');
			expect(within(row).queryByRole('button')).not.toBeInTheDocument();
		});

		test('Enter on "+N" opens it too', async () => {
			showFirst(3);
			const { user } = setup();
			screen.getByRole('button', { name: SHOW_3 }).focus();
			await user.keyboard('{Enter}');
			expect(screen.getByRole('dialog', { name: MORE_3 })).toBeVisible();
		});

		test('it does not open on hover', async () => {
			showFirst(3);
			const { user } = setup();
			await user.hover(screen.getByRole('button', { name: SHOW_3 }));
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		test('Esc closes it and gives the focus back to "+N"', async () => {
			showFirst(3);
			const { user } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.keyboard('{Escape}');
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_3 })).toHaveFocus();
		});

		test('a click outside closes it', async () => {
			showFirst(3);
			const { user } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(document.body);
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		test('moving the pointer away does not close it', async () => {
			showFirst(3);
			const { user } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.unhover(screen.getByRole('dialog'));
			expect(screen.getByRole('dialog')).toBeVisible();
		});

		test('Tab out of it closes it', async () => {
			showFirst(3);
			const { user } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			// focus on the "×" of Project; then Q4 renewal, Urgent, then out
			await user.tab();
			await user.tab();
			await user.tab();
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		test('removing a hidden tag: the row goes, the count updates, focus on the next "×"', async () => {
			showFirst(3);
			const onRemove = vi.fn();
			const { user, rerenderWith } = setup({ onRemove });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: REMOVE_PROJECT }));
			expect(onRemove).toHaveBeenCalledWith(project, expect.anything());

			rerenderWith({ onRemove, tags: [client, escalation, partners, renewal, urgent] });
			const card = screen.getByRole('dialog', { name: '2 more tags' });
			expect(within(card).queryByText('Project')).not.toBeInTheDocument();
			expect(within(card).getByRole('button', { name: REMOVE_RENEWAL })).toHaveFocus();
		});

		test('a render before the hidden tag goes keeps the focus for the next "×"', async () => {
			showFirst(3);
			const onRemove = vi.fn();
			const { user, rerenderWith } = setup({ onRemove });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: REMOVE_PROJECT }));
			rerenderWith({ onRemove, tags: [...allSix] });
			rerenderWith({ onRemove, tags: [client, escalation, partners, renewal, urgent] });
			expect(screen.getByRole('button', { name: REMOVE_RENEWAL })).toHaveFocus();
		});

		test('with nothing to remove or add (Spam), the card still closes from the keyboard', async () => {
			showFirst(3);
			const { user } = setup({ onRemove: undefined, menu: undefined });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			expect(screen.getByRole('dialog', { name: MORE_3 })).toHaveFocus();
			await user.keyboard('{Escape}');
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_3 })).toHaveFocus();
		});

		test('removing the last hidden row moves the focus to the previous "×"', async () => {
			showFirst(3);
			const { user, rerenderWith } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: REMOVE_URGENT }));
			rerenderWith({ tags: [client, escalation, partners, project, renewal] });
			expect(screen.getByRole('button', { name: REMOVE_RENEWAL })).toHaveFocus();
		});

		test('the pills behind do not change while it is open', async () => {
			showFirst(3);
			const { user, rerenderWith } = setup();
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			showAll();
			rerenderWith({ tags: [client, escalation, partners, renewal, urgent] });
			expect(pillNames().slice(0, 3)).toEqual(['Client', CUSTOMER_ESCALATION, 'Partners']);
			expect(screen.getByRole('button', { name: 'Show 2 more tags' })).toBeInTheDocument();
		});

		test('removing every hidden tag closes it, "+N" goes and the focus is on the last pill', async () => {
			showFirst(3);
			const { user, rerenderWith } = setup({ tags: [client, escalation, partners, urgent] });
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: REMOVE_URGENT }));
			rerenderWith({ tags: [client, escalation, partners] });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /more tag/ })).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Partners' })).toHaveFocus();
		});

		test('after Undo the tag comes back as "+1" with the focus on it, closed', async () => {
			showFirst(3);
			const onRemove = vi.fn();
			const { user, rerenderWith } = setup({
				onRemove,
				tags: [client, escalation, partners, urgent]
			});
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: REMOVE_URGENT }));
			rerenderWith({ onRemove, tags: [client, escalation, partners] });

			const { onUndo } = onRemove.mock.calls[0][1];
			act(() => onUndo());
			rerenderWith({ onRemove, tags: [client, escalation, partners, urgent] });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_1 })).toHaveFocus();
		});

		test('after Undo of a visible pill the focus goes back to that pill', async () => {
			const onRemove = vi.fn();
			const { user, rerenderWith } = setup({ onRemove, tags: [client, urgent] });
			await user.click(screen.getByRole('button', { name: 'Remove tag Client' }));
			rerenderWith({ onRemove, tags: [urgent] });
			const { onUndo } = onRemove.mock.calls[0][1];
			act(() => onUndo());
			rerenderWith({ onRemove, tags: [client, urgent] });
			expect(screen.getByRole('button', { name: 'Client' })).toHaveFocus();
		});
	});

	describe('ADD TAGS', () => {
		const menu = {
			allTags: [
				client,
				escalation,
				partners,
				tag('7', 'Personal', '#f6b7d6'),
				project,
				renewal,
				urgent
			],
			onToggle: vi.fn()
		};

		test('replaces the hidden tags with every tag, the applied ones checked', async () => {
			showFirst(3);
			const { user } = setup({ menu });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: /add tags/i }));

			expect(screen.queryByRole('button', { name: REMOVE_PROJECT })).not.toBeInTheDocument();
			expect(screen.getByRole('menuitemcheckbox', { name: 'Client' })).toBeChecked();
			expect(screen.getByRole('menuitemcheckbox', { name: 'Personal' })).not.toBeChecked();
			expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(7);
		});

		test('each check applies at once, the menu stays open and the change is announced', async () => {
			showFirst(3);
			const onToggle = vi.fn();
			const { user } = setup({ menu: { ...menu, onToggle } });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: /add tags/i }));

			await user.click(screen.getByRole('menuitemcheckbox', { name: 'Personal' }));
			expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ name: 'Personal' }), true);
			expect(screen.getByRole('status')).toHaveTextContent('Personal added');

			await user.click(screen.getByRole('menuitemcheckbox', { name: 'Client' }));
			expect(onToggle).toHaveBeenCalledWith(client, false);
			expect(screen.getByRole('status')).toHaveTextContent('Client removed');
			expect(screen.getByRole('menu')).toBeVisible();
		});

		test('the arrow keys, Home and End move between its items, as in any menu', async () => {
			showFirst(3);
			const { user } = setup({ menu });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: /add tags/i }));
			const items = screen.getAllByRole('menuitemcheckbox');
			expect(items[0]).toHaveFocus();

			await user.keyboard('{ArrowDown}');
			expect(items[1]).toHaveFocus();
			await user.keyboard('{ArrowUp}{ArrowUp}');
			expect(items[items.length - 1]).toHaveFocus();
			await user.keyboard('{ArrowDown}');
			expect(items[0]).toHaveFocus();
			await user.keyboard('{End}');
			expect(items[items.length - 1]).toHaveFocus();
			await user.keyboard('{Home}');
			expect(items[0]).toHaveFocus();
		});

		test('Esc closes it and gives the focus back to "+N"', async () => {
			showFirst(3);
			const { user } = setup({ menu });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			await user.click(screen.getByRole('button', { name: /add tags/i }));
			await user.keyboard('{Escape}');
			expect(screen.queryByRole('menu')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_3 })).toHaveFocus();
		});

		test('unchecking the last hidden tag closes the menu, focus on the last pill', async () => {
			showFirst(5);
			const onToggle = vi.fn();
			const { user, rerenderWith } = setup({ menu: { ...menu, onToggle } });
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: /add tags/i }));
			await user.click(screen.getByRole('menuitemcheckbox', { name: 'Urgent' }));

			rerenderWith({
				menu: { ...menu, onToggle },
				tags: [client, escalation, partners, project, renewal]
			});
			expect(screen.queryByRole('menu')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: Q4_RENEWAL })).toHaveFocus();

			// Applied again from elsewhere: it is hidden as "+1", the menu does not come back by itself
			rerenderWith({ menu: { ...menu, onToggle }, tags: allSix });
			expect(screen.queryByRole('menu')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_1 })).toHaveAttribute(
				'aria-expanded',
				'false'
			);
		});

		test('without a menu there is no ADD TAGS', async () => {
			showFirst(3);
			const { user } = setup({ menu: undefined });
			await user.click(screen.getByRole('button', { name: SHOW_3 }));
			expect(screen.queryByRole('button', { name: /add tags/i })).not.toBeInTheDocument();
		});
	});
});
