/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Divider, Icon, Portal, Text, Tooltip } from '@zextras/carbonio-design-system';
import { TagDot, TagPillItem } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { VisuallyHidden } from 'commons/visually-hidden';

/** As in the design: wide enough for most tag names, long ones are truncated. */
const CARD_WIDTH_PX = 240;
/** Space between "+N" and the card. */
const CARD_OFFSET_PX = 4;
const VIEWPORT_MARGIN_PX = 8;

const TABBABLE =
	'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const Card = styled.div`
	position: fixed;
	/* As the DS Popper: above the boards, below dropdowns and modals (999). */
	z-index: 99;
	box-sizing: border-box;
	width: ${CARD_WIDTH_PX / 16}rem;
	overflow-y: auto;
	padding: ${({ theme }): string => theme.sizes.padding.small} 0;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background-color: ${({ theme }): string => theme.palette.gray6.regular};
	box-shadow: ${({ theme }): string => theme.shadows.regular};
`;

const Title = styled(Text)`
	padding: 0.25rem 0.75rem 0.375rem;
	color: ${({ theme }): string => theme.palette.secondary.active};
`;

const HiddenRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-height: 2rem;
	padding: 0 0.75rem;
`;

const RowName = styled(Text)`
	flex: 1 1 auto;
	min-width: 0;
`;

const RemoveButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1.5rem;
	height: 1.5rem;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: transparent;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background-color: ${({ theme }): string => theme.palette.gray6.hover};
	}
`;

const MenuItem = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	min-height: 2rem;
	padding: 0.5rem 1rem;
	border: none;
	background: transparent;
	font: inherit;
	text-align: left;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background-color: ${({ theme }): string => theme.palette.gray6.hover};
	}

	/* A long name shrinks, never the checkbox or the dot. */
	& > * {
		flex: none;
	}

	& > :nth-child(2) {
		flex: 0 1 auto;
		min-width: 0;
	}
`;

type Position = { left: number; top?: number; bottom?: number; maxHeight: number };

/** Below "+N", or above it when there is more room there; always inside the window. */
const positionFor = (anchor: DOMRect): Position => {
	const left = Math.max(
		VIEWPORT_MARGIN_PX,
		Math.min(anchor.left, globalThis.innerWidth - CARD_WIDTH_PX - VIEWPORT_MARGIN_PX)
	);
	const below = globalThis.innerHeight - anchor.bottom - CARD_OFFSET_PX - VIEWPORT_MARGIN_PX;
	const above = anchor.top - CARD_OFFSET_PX - VIEWPORT_MARGIN_PX;
	return below >= above
		? { left, top: anchor.bottom + CARD_OFFSET_PX, maxHeight: below }
		: { left, bottom: globalThis.innerHeight - anchor.top + CARD_OFFSET_PX, maxHeight: above };
};

/** The next element the Tab key would reach after `anchor`, outside `container`. */
const nextTabbableAfter = (
	anchor: HTMLElement,
	container: HTMLElement
): HTMLElement | undefined => {
	const all = Array.from(document.querySelectorAll<HTMLElement>(TABBABLE)).filter(
		(element) => !container.contains(element)
	);
	return all[all.indexOf(anchor) + 1];
};

export type TagMenu = {
	/** Every tag of the user, in the order of the tag menu. */
	allTags: ReadonlyArray<TagPillItem>;
	/** Applies (`apply` true) or removes the tag at once. */
	onToggle: (tag: TagPillItem, apply: boolean) => void;
};

export type HiddenTagsPopoverProps = {
	anchorRef: React.RefObject<HTMLElement>;
	mode: 'hidden' | 'menu';
	hiddenTags: ReadonlyArray<TagPillItem>;
	/** Tags of the item, to check them in the menu. */
	appliedIds: ReadonlySet<string>;
	removeLabel: (tag: TagPillItem) => string;
	onRemove?: (tag: TagPillItem, index: number) => void;
	menu?: TagMenu;
	onShowMenu: () => void;
	/** `restoreFocus`: give the focus back to "+N" (Esc); not after a click outside or Tab. */
	onClose: (restoreFocus: boolean) => void;
};

/**
 * The tags that don't fit in the reading pane, opened by a click on "+N": each with its "×", and ADD
 * TAGS, which turns the card into the tag menu. Closed by Esc, a click outside or Tab out, never by
 * moving the pointer away. Not the DS Popover: its Popper keeps the Tab key inside it.
 */
export const HiddenTagsPopover = ({
	anchorRef,
	mode,
	hiddenTags,
	appliedIds,
	removeLabel,
	onRemove,
	menu,
	onShowMenu,
	onClose
}: Readonly<HiddenTagsPopoverProps>): React.JSX.Element | null => {
	const [t] = useTranslation();
	const cardRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<Position | undefined>();
	const [announcement, setAnnouncement] = useState('');

	useLayoutEffect(() => {
		const anchor = anchorRef.current;
		if (anchor) {
			setPosition(positionFor(anchor.getBoundingClientRect()));
		}
	}, [anchorRef]);

	// The card is fixed: when what is behind it scrolls or the window changes, it would be left behind.
	useEffect(() => {
		const onScroll = (event: Event): void => {
			if (!cardRef.current?.contains(event.target as Node)) {
				onClose(false);
			}
		};
		const onResize = (): void => onClose(false);
		const onPointerDown = (event: PointerEvent | MouseEvent): void => {
			const target = event.target as Node;
			if (!cardRef.current?.contains(target) && !anchorRef.current?.contains(target)) {
				onClose(false);
			}
		};
		globalThis.addEventListener('scroll', onScroll, true);
		globalThis.addEventListener('resize', onResize);
		document.addEventListener('mousedown', onPointerDown);
		return (): void => {
			globalThis.removeEventListener('scroll', onScroll, true);
			globalThis.removeEventListener('resize', onResize);
			document.removeEventListener('mousedown', onPointerDown);
		};
	}, [anchorRef, onClose]);

	// The first focusable element of what the card shows: the first "×", or the first menu item. With
	// none (tags that can't be changed), the card itself, so Esc and Tab still reach it.
	useEffect(() => {
		const card = cardRef.current;
		(card?.querySelector<HTMLElement>(TABBABLE) ?? card)?.focus();
	}, [mode]);

	// A menu: the arrow keys, Home and End move between the items (Tab still goes through them too)
	const onMenuKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
		const items = Array.from(
			event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')
		);
		const current = items.indexOf(document.activeElement as HTMLElement);
		const target = {
			ArrowDown: (current + 1) % items.length,
			// From the menu itself (no item focused) ArrowUp goes to the last one
			ArrowUp: current <= 0 ? items.length - 1 : current - 1,
			Home: 0,
			End: items.length - 1
		}[event.key];
		if (target === undefined || items.length === 0) {
			return;
		}
		event.preventDefault();
		items[target].focus();
	}, []);

	const onKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Escape') {
				event.stopPropagation();
				onClose(true);
				return;
			}
			const card = cardRef.current;
			const anchor = anchorRef.current;
			if (event.key !== 'Tab' || !card || !anchor) {
				return;
			}
			const tabbables = Array.from(card.querySelectorAll<HTMLElement>(TABBABLE));
			// Nothing to tab to: the card itself is both ends
			const first = tabbables[0] ?? card;
			const last = tabbables[tabbables.length - 1] ?? card;
			// The card is in a portal at the end of the page: Tab out of it goes on from "+N".
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				onClose(false);
				anchor.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				const next = nextTabbableAfter(anchor, card);
				onClose(false);
				next?.focus();
			}
		},
		[anchorRef, onClose]
	);

	const toggle = useCallback(
		(tag: TagPillItem) => {
			const apply = !appliedIds.has(tag.id);
			menu?.onToggle(tag, apply);
			setAnnouncement(
				apply
					? t('label.tag_added_name', { name: tag.name, defaultValue: '{{name}} added' })
					: t('label.tag_removed_name', { name: tag.name, defaultValue: '{{name}} removed' })
			);
		},
		[appliedIds, menu, t]
	);

	const title = t('label.more_tags', {
		count: hiddenTags.length,
		defaultValue_one: '{{count}} more tag',
		defaultValue_other: '{{count}} more tags'
	});

	return (
		<Portal show>
			<Card
				ref={cardRef}
				role="dialog"
				tabIndex={-1}
				aria-label={mode === 'hidden' ? title : t('label.tags', 'Tags')}
				data-testid="hidden-tags-popover"
				onKeyDown={onKeyDown}
				style={
					position && {
						left: position.left,
						top: position.top,
						bottom: position.bottom,
						maxHeight: position.maxHeight
					}
				}
			>
				{mode === 'hidden' ? (
					<>
						<Title size="small">{title}</Title>
						{hiddenTags.map((tag, index) => (
							<HiddenRow key={tag.id} data-testid="hidden-tag-row" data-tag-id={tag.id}>
								{tag.shared ? (
									<Icon icon="PeopleOutline" size="small" color="text" />
								) : (
									tag.color && <TagDot color={tag.color} />
								)}
								<Tooltip
									label={tag.tooltip ?? tag.name}
									overflowTooltip={tag.tooltip === undefined}
								>
									<RowName overflow="ellipsis">{tag.name}</RowName>
								</Tooltip>
								{onRemove && !tag.shared && (
									<Tooltip label={t('label.remove_tag', 'Remove tag')}>
										<RemoveButton
											type="button"
											aria-label={removeLabel(tag)}
											onClick={(): void => onRemove(tag, index)}
										>
											<Icon icon="Close" size="medium" color="text" />
										</RemoveButton>
									</Tooltip>
								)}
							</HiddenRow>
						))}
						{menu && (
							<>
								<Divider />
								<div style={{ padding: '0.5rem 0.5rem 0.125rem' }}>
									<Button
										type="ghost"
										size="small"
										label={t('label.add_tags', 'Add tags')}
										onClick={onShowMenu}
									/>
								</div>
							</>
						)}
					</>
				) : (
					<div
						role="menu"
						aria-label={t('label.tags', 'Tags')}
						tabIndex={-1}
						onKeyDown={onMenuKeyDown}
					>
						{menu?.allTags.map((tag) => {
							const checked = appliedIds.has(tag.id);
							return (
								<MenuItem
									key={tag.id}
									type="button"
									role="menuitemcheckbox"
									aria-checked={checked}
									onClick={(): void => toggle(tag)}
								>
									<Icon
										icon={checked ? 'CheckmarkSquare' : 'SquareOutline'}
										size="medium"
										color={checked ? 'primary' : 'text'}
									/>
									<Text overflow="ellipsis">{tag.name}</Text>
									{tag.color && <TagDot color={tag.color} />}
								</MenuItem>
							);
						})}
					</div>
				)}
				<VisuallyHidden role="status">{announcement}</VisuallyHidden>
			</Card>
		</Portal>
	);
};
