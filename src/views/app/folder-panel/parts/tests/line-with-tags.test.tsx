/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, isInaccessible, screen, within } from '@testing-library/react';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';

import { LineWithTags, LineWithTagsProps } from '../line-with-tags';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { ConvActionRequest } from 'types/soap/conv-action';
import { MsgActionRequest } from 'types/soap/msg-action';

/** Makes every observed line report `width` px, instead of the 1920 of the global mock. */
const lineWidth = (width: number): void => {
	window.ResizeObserver = vi.fn(function ResizeObserverMock(
		this: ResizeObserver,
		callback: ResizeObserverCallback
	): ResizeObserver {
		return {
			observe: (target: Element): void =>
				callback(
					[{ target, contentRect: { width } as DOMRectReadOnly } as ResizeObserverEntry],
					this
				),
			unobserve: noop,
			disconnect: noop
		};
	});
};

const ICON_PILL = 'icon-tag-pill';
const SHARED_FINANCE = 'nil:Finance';
const SUBJECT = <span>Subject</span>;

const CONVERSATION: LineWithTagsProps['target'] = {
	kind: 'conversation',
	id: '20',
	folderId: FOLDERS.INBOX
};

describe('LineWithTags', () => {
	const globalResizeObserver = window.ResizeObserver;

	afterEach(() => {
		window.ResizeObserver = globalResizeObserver;
	});

	beforeEach(() => {
		useTagStore.setState({
			tags: {
				1: { id: '1', name: 'Urgent', color: 5 },
				2: { id: '2', name: 'Client', color: 1 }
			}
		});
	});

	it('shows the content of the line and a pill for each tag, alphabetically', () => {
		setupTest(
			<LineWithTags target={CONVERSATION} tagIds={['1', '2']}>
				{SUBJECT}
			</LineWithTags>
		);

		expect(screen.getByText('Subject')).toBeVisible();
		expect(screen.getAllByTestId('tag-pill').map((pill) => pill.textContent)).toEqual([
			'Client',
			'Urgent'
		]);
	});

	it('names every tag for screen readers, never "+N"', () => {
		setupTest(
			<LineWithTags target={CONVERSATION} tagIds={['1', '2']}>
				{SUBJECT}
			</LineWithTags>
		);

		expect(screen.getByText('Tags: Client, Urgent')).toBeInTheDocument();
		screen.getAllByTestId('tag-pill').forEach((pill) => {
			expect(isInaccessible(pill)).toBe(true);
		});
	});

	it('fits fewer pills in the smaller budget of a conversation child row', () => {
		lineWidth(400);
		const { unmount } = setupTest(
			<LineWithTags target={CONVERSATION} tagIds={['1', '2']}>
				{SUBJECT}
			</LineWithTags>
		);
		expect(screen.getAllByTestId('tag-pill')).toHaveLength(2);
		unmount();

		setupTest(
			<LineWithTags target={CONVERSATION} tagIds={['1', '2']} maxBudget={120}>
				<span>Sender</span>
			</LineWithTags>
		);
		expect(screen.getAllByTestId('tag-pill')).toHaveLength(1);
		expect(screen.getAllByTestId(ICON_PILL)).toHaveLength(1);
	});

	it('still names the tags for screen readers before the line has a width', () => {
		lineWidth(0);
		setupTest(
			<LineWithTags target={CONVERSATION} tagIds={['1', '2']}>
				{SUBJECT}
			</LineWithTags>
		);

		expect(screen.queryByTestId('tag-pill')).not.toBeInTheDocument();
		expect(screen.getByText('Tags: Client, Urgent')).toBeInTheDocument();
	});

	it('names the tags of a shared folder apart', () => {
		setupTest(
			<LineWithTags target={CONVERSATION} tagIds={['1', SHARED_FINANCE]}>
				{SUBJECT}
			</LineWithTags>
		);

		expect(screen.getByText('Tags: Urgent')).toBeInTheDocument();
		expect(screen.getByText('Shared folder tags: Finance')).toBeInTheDocument();
	});

	it('shows only the content when the item has no tags', () => {
		setupTest(
			<LineWithTags target={CONVERSATION} tagIds={[]}>
				{SUBJECT}
			</LineWithTags>
		);

		expect(screen.getByText('Subject')).toBeVisible();
		expect(screen.queryByTestId('tag-pill')).not.toBeInTheDocument();
		expect(screen.queryByText(/Tags:/)).not.toBeInTheDocument();
	});

	describe('"+N" in the list', () => {
		const FIVE = ['1', '2', '3', '4', '5'];
		const SHOW_1 = 'Show 1 more tag';
		const ONE_MORE_TAG = '1 more tag';
		const REMOVE_EEEE = 'Remove tag Eeee from conversation';

		/** On a 482px line five short tags show as two pills, three icons... but for the last one: "+1". */
		const setupRow = (
			props: Partial<LineWithTagsProps> = {}
		): ReturnType<typeof setupTest> & {
			onRowClick: ReturnType<typeof vi.fn>;
			rerenderWith: (next: Partial<LineWithTagsProps>) => void;
		} => {
			lineWidth(482);
			const onRowClick = vi.fn();
			const onRowKeyDown = vi.fn();
			const base: LineWithTagsProps = {
				target: CONVERSATION,
				tagIds: FIVE,
				children: SUBJECT,
				...props
			};
			const row = (next: Partial<LineWithTagsProps>): React.JSX.Element => (
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				<div
					data-testid="row"
					onClick={onRowClick}
					onKeyDown={onRowKeyDown}
					onDoubleClick={onRowClick}
				>
					<LineWithTags {...base} {...next} />
				</div>
			);
			const result = setupTest(row({}));
			return {
				...result,
				onRowClick,
				rerenderWith: (next): void => result.rerender(row(next))
			};
		};

		beforeEach(() => {
			useTagStore.setState({
				tags: {
					1: { id: '1', name: 'Aaaa', color: 1 },
					2: { id: '2', name: 'Bbbb', color: 2 },
					3: { id: '3', name: 'Cccc', color: 3 },
					4: { id: '4', name: 'Dddd', color: 4 },
					5: { id: '5', name: 'Eeee', color: 5 }
				}
			});
		});

		it('is a button named "Show N more tags", a Tab stop', async () => {
			const { user } = setupRow();

			expect(screen.getAllByTestId('tag-pill')).toHaveLength(2);
			expect(screen.getAllByTestId(ICON_PILL)).toHaveLength(2);
			const more = screen.getByRole('button', { name: SHOW_1 });
			expect(more).toHaveTextContent('+1');
			await user.tab();
			expect(more).toHaveFocus();
		});

		it('has the tooltip "Show N more tags" on hover', async () => {
			const { user } = setupRow();

			await user.hover(screen.getByRole('button', { name: SHOW_1 }));

			expect(await screen.findByText(SHOW_1)).toBeVisible();
		});

		it('a click opens the hidden tags, each with its "×", and MANAGE TAGS, without opening the item', async () => {
			const { user, onRowClick } = setupRow();

			await user.click(screen.getByRole('button', { name: SHOW_1 }));

			const card = screen.getByRole('dialog', { name: ONE_MORE_TAG });
			expect(within(card).getByText('Eeee')).toBeVisible();
			expect(within(card).getByRole('button', { name: REMOVE_EEEE })).toHaveFocus();
			expect(within(card).getByRole('button', { name: /manage tags/i })).toBeVisible();
			await user.click(within(card).getByText('Eeee'));
			expect(onRowClick).not.toHaveBeenCalled();
		});

		it('Enter opens it too, without opening the item; Esc gives the focus back to "+N"', async () => {
			const { user, onRowClick } = setupRow();
			act(() => screen.getByRole('button', { name: SHOW_1 }).focus());

			await user.keyboard('{Enter}');
			expect(screen.getByRole('dialog')).toBeVisible();
			await user.keyboard('{Escape}');

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_1 })).toHaveFocus();
			expect(onRowClick).not.toHaveBeenCalled();
		});

		it('Enter and Space on "+N" never reach the row, whose context menu listens to them on the DOM', async () => {
			const rowKeys = vi.fn();
			const onRowKey = (event: KeyboardEvent): void => {
				if (event.key === 'Enter' || event.key === ' ') {
					rowKeys(event.key);
				}
			};
			const { user } = setupRow();
			const row = screen.getByTestId('row');
			row.addEventListener('keydown', onRowKey);
			row.addEventListener('keyup', onRowKey);
			act(() => screen.getByRole('button', { name: SHOW_1 }).focus());

			await user.keyboard('{Enter}');
			expect(screen.getByRole('dialog')).toBeVisible();
			await user.keyboard('{Escape}');
			await user.keyboard(' ');

			expect(rowKeys).not.toHaveBeenCalled();
			expect(screen.getByRole('dialog')).toBeVisible();
		});

		it('"×" removes the tag from the whole conversation', async () => {
			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user } = setupRow();

			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: REMOVE_EEEE }));

			expect((await interceptor).action).toEqual(
				expect.objectContaining({ id: '20', op: '!tag', tn: 'Eeee' })
			);
		});

		it('the row does not reflow while the hidden tags are open, and recalculates on close', async () => {
			const { user, rerenderWith } = setupRow({ tagIds: [...FIVE, SHARED_FINANCE] });
			await user.click(screen.getByRole('button', { name: 'Show 2 more tags' }));

			// Dddd, shown as an icon, is removed from another client: the row keeps its place
			lineWidth(2000);
			rerenderWith({ tagIds: ['1', '2', '3', '5', SHARED_FINANCE] });
			expect(screen.getAllByTestId(ICON_PILL)).toHaveLength(1);
			expect(within(screen.getByRole('dialog')).getByText('Eeee')).toBeVisible();

			await user.keyboard('{Escape}');
			expect(screen.getAllByTestId(ICON_PILL).length).toBeGreaterThan(1);
		});

		describe('when the list moves under the open card', () => {
			/** jsdom has no DOMRect. */
			const rect = (x: number, y: number, width: number, height: number): DOMRect =>
				({
					x,
					y,
					left: x,
					top: y,
					right: x + width,
					bottom: y + height,
					width,
					height,
					toJSON: noop
				}) as DOMRect;
			/** Where "+N" is: `top` px from the top of the window, in a list that shows 0 to 600px. */
			const placeMore = (more: HTMLElement, top: number): void => {
				vi.spyOn(more, 'getBoundingClientRect').mockReturnValue(rect(400, top, 24, 20));
			};
			const showListUpTo = (bottom: number): void => {
				const list = screen.getByTestId('row');
				list.style.overflowY = 'auto';
				vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 800, bottom));
			};
			const nextFrames = (): void => {
				act(() => {
					vi.advanceTimersByTime(50);
				});
			};

			it('stays open when the list scrolls but "+N" stays where it is (a new mail above it)', async () => {
				const { user } = setupRow();
				const more = screen.getByRole('button', { name: SHOW_1 });
				showListUpTo(600);
				placeMore(more, 100);
				await user.click(more);

				act(() => {
					screen.getByTestId('row').dispatchEvent(new Event('scroll'));
				});
				nextFrames();

				expect(screen.getByRole('dialog', { name: ONE_MORE_TAG })).toBeVisible();
			});

			it('follows "+N" when its row moves', async () => {
				const { user } = setupRow();
				const more = screen.getByRole('button', { name: SHOW_1 });
				showListUpTo(600);
				placeMore(more, 100);
				await user.click(more);
				const card = screen.getByRole('dialog', { name: ONE_MORE_TAG });
				expect(card).toHaveStyle({ top: '124px' });

				placeMore(more, 164);
				nextFrames();

				expect(card).toHaveStyle({ top: '188px' });
			});

			it('stays on the side of "+N" where it opened while there is room for it', async () => {
				const { user } = setupRow();
				const more = screen.getByRole('button', { name: SHOW_1 });
				showListUpTo(700);
				placeMore(more, 100);
				await user.click(more);

				// Now there is more room above "+N", but the card still fits below
				placeMore(more, 400);
				nextFrames();

				expect(screen.getByRole('dialog', { name: ONE_MORE_TAG })).toHaveStyle({ top: '424px' });
			});

			it('moves to the other side of "+N" when it no longer fits on its own', async () => {
				const { user } = setupRow();
				const more = screen.getByRole('button', { name: SHOW_1 });
				showListUpTo(768);
				placeMore(more, 100);
				await user.click(more);
				const card = screen.getByRole('dialog', { name: ONE_MORE_TAG });
				vi.spyOn(card, 'offsetHeight', 'get').mockReturnValue(200);

				// 44px left below "+N", for a card of 200px
				placeMore(more, 700);
				nextFrames();

				expect(card).toHaveStyle({ bottom: '72px' });
			});

			it('closes when "+N" leaves the visible part of the list', async () => {
				const { user } = setupRow();
				const more = screen.getByRole('button', { name: SHOW_1 });
				showListUpTo(600);
				placeMore(more, 100);
				await user.click(more);

				placeMore(more, 640);
				nextFrames();

				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('in Spam the hidden tags can be neither removed nor managed', async () => {
			const { user } = setupRow({ target: { ...CONVERSATION, folderId: FOLDERS.SPAM } });

			await user.click(screen.getByRole('button', { name: SHOW_1 }));

			expect(screen.queryByRole('button', { name: REMOVE_EEEE })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /manage tags/i })).not.toBeInTheDocument();
		});

		it('"×" of a message row removes the tag from that message', async () => {
			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
			const { user } = setupRow({ target: { kind: 'message', id: '7', folderId: FOLDERS.INBOX } });

			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: 'Remove tag Eeee' }));

			expect((await interceptor).action).toEqual(
				expect.objectContaining({ id: '7', op: '!tag', tn: 'Eeee' })
			);
		});

		it('after a removal the focus goes to the next "×", or to the previous one at the end', async () => {
			useTagStore.setState((state) => ({
				tags: {
					...state.tags,
					6: { id: '6', name: 'Ffff', color: 6 },
					7: { id: '7', name: 'Gggg', color: 7 }
				}
			}));
			const all = [...FIVE, '6', '7'];
			const { user, rerenderWith } = setupRow({ tagIds: all });
			await user.click(screen.getByRole('button', { name: /^Show \d more tags$/ }));
			const removeButtons = within(screen.getByRole('dialog')).getAllByRole('button', {
				name: /^Remove tag/
			});
			expect(removeButtons.length).toBeGreaterThanOrEqual(3);
			const names = removeButtons.map((button) => button.getAttribute('aria-label') ?? '');

			const first = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			await user.click(removeButtons[0]);
			const firstTag = (await first).action.tn;
			const left = all.filter((id) => useTagStore.getState().tags[id].name !== firstTag);
			rerenderWith({ tagIds: left });
			expect(screen.getByRole('button', { name: names[1] })).toHaveFocus();

			const last = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			await user.click(screen.getByRole('button', { name: names[names.length - 1] }));
			const lastTag = (await last).action.tn;
			rerenderWith({
				tagIds: left.filter((id) => useTagStore.getState().tags[id].name !== lastTag)
			});
			expect(screen.getByRole('button', { name: names[names.length - 2] })).toHaveFocus();
		});

		it('after Undo of a tag that comes back as a pill, a later "+N" leaves the focus alone', async () => {
			const removal = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user, rerenderWith } = setupRow();
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: REMOVE_EEEE }));
			await removal;
			rerenderWith({ tagIds: ['1', '2', '3', '4'] });

			const undo = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			await user.click(await screen.findByRole('button', { name: /undo/i }));
			await undo;
			// Two other tags went meanwhile (another client): Eeee comes back as a pill, there is no "+N"
			rerenderWith({ tagIds: ['1', '2', '5'] });
			expect(screen.queryByRole('button', { name: SHOW_1 })).not.toBeInTheDocument();

			// Later they are back: the new "+N" leaves the focus where it is
			rerenderWith({ tagIds: FIVE });
			expect(screen.getByRole('button', { name: SHOW_1 })).not.toHaveFocus();
		});

		it('when every tag goes while the tag menu is open, nothing stays open', async () => {
			const { user, rerenderWith } = setupRow();
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: /manage tags/i }));

			rerenderWith({ tagIds: [] });
			rerenderWith({ tagIds: FIVE });

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: SHOW_1 })).toHaveAttribute(
				'aria-expanded',
				'false'
			);
		});

		it('removing the last hidden tag closes it; after Undo the tag comes back as "+1" with the focus', async () => {
			const removal = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user, rerenderWith } = setupRow();
			await user.click(screen.getByRole('button', { name: SHOW_1 }));
			await user.click(screen.getByRole('button', { name: REMOVE_EEEE }));
			await removal;
			rerenderWith({ tagIds: ['1', '2', '3', '4'] });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: SHOW_1 })).not.toBeInTheDocument();

			const undo = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			await user.click(await screen.findByRole('button', { name: /undo/i }));
			await undo;
			rerenderWith({ tagIds: FIVE });

			expect(await screen.findByRole('button', { name: SHOW_1 })).toHaveFocus();
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});
});
