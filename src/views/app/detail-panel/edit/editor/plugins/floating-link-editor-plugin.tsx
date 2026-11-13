/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';
import {
	$createAutoLinkNode,
	$isAutoLinkNode,
	$isLinkNode,
	type AutoLinkNode,
	type LinkMatcher,
	type LinkNode
} from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, $unwrapNode } from '@lexical/utils';
import { Button, Link, Row } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNearestNodeFromDOMNode, $getNodeByKey, $isTextNode, type TextNode } from 'lexical';
import { createPortal } from 'react-dom';

import { matchFirstAutoLink, matchWholeAutoLink } from './auto-link-plugin';
import { LinkModal } from './link-modal';

type LinkInfo = {
	url: string;
	// The URL with unsafe schemes (e.g. `javascript:`) replaced, used as the card's href.
	href: string;
	key: string;
	// The link was removed from an auto-detected URL: only "Restore link" is offered.
	unlinked: boolean;
	top: number;
	left: number;
};

// Grace period before the card hides once the pointer leaves the link: it must
// be long enough to travel from the link down to the card without losing it.
const HIDE_DELAY_MS = 500;

const FloatingLinkCard = styled(Row)`
	position: absolute;
	z-index: 5;
	max-width: 24rem;
	background: ${({ theme }): string => theme.palette.gray6.regular};
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	border-radius: 0.25rem;
	box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.2);

	&::before {
		content: '';
		position: absolute;
		top: -0.25rem;
		left: 0;
		right: 0;
		height: 0.25rem;
	}
`;

const UrlLink = styled(Link)`
	max-width: 16rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

/** A removed auto-link for the match: restored, it opens like any auto-link. */
function $createRemovedAutoLinkNode(match: NonNullable<ReturnType<LinkMatcher>>): AutoLinkNode {
	return $createAutoLinkNode(match.url, { ...match.attributes, isUnlinked: true });
}

/**
 * Wraps each URL or email address in the text node into a removed auto-link, so
 * that the auto-link plugin does not turn it into a link.
 */
function $keepAutoLinksRemoved(textNode: TextNode): void {
	const match = textNode.isSimpleText() ? matchFirstAutoLink(textNode.getTextContent()) : null;
	if (!match) {
		return;
	}
	// No empty part is returned: the match comes first when it starts the text.
	const parts = textNode.splitText(match.index, match.index + match.length);
	const matchIndex = match.index === 0 ? 0 : 1;
	const linkText = parts[matchIndex];
	const autoLink = $createRemovedAutoLinkNode(match);
	linkText.replace(autoLink);
	autoLink.append(linkText);
	// The first matcher that matches decides, not the first link in the text: the
	// text before the match can hold one as well as the text after it.
	parts.filter((_part, index) => index !== matchIndex).forEach($keepAutoLinksRemoved);
}

/**
 * Removes the link, keeping its text and inline formatting. Once unwrapped, the
 * auto-link plugin would immediately turn a URL or an email address in that text
 * into a link again, so it is kept as a removed auto-link instead: an auto-detected
 * link is flagged as removed, a regular link whose whole text is one becomes a
 * removed auto-link (as every link of a draft that is loaded again, or of a quoted
 * message, is), and in any other link the ones within its text are wrapped. A
 * removed auto-link is saved with its marker, so it stays removed when the draft
 * is reopened, and it can be restored from the card.
 */
function $removeLink(node: LinkNode): void {
	if ($isAutoLinkNode(node)) {
		node.setIsUnlinked(true);
		return;
	}
	const match = matchWholeAutoLink(node.getTextContent());
	if (match) {
		node.replace($createRemovedAutoLinkNode(match), true);
		return;
	}
	const textNodes = node.getChildren().filter($isTextNode);
	$unwrapNode(node);
	textNodes.forEach($keepAutoLinksRemoved);
}

/**
 * Floating editor for links, mirroring the Lexical playground affordance. The
 * card is shown only while the pointer hovers a link or after the link is pressed
 * (which pins it open so its actions stay reachable); it exposes the destination
 * URL (opening in a new tab) plus actions to edit the link (reusing the
 * "Insert/Edit Link" modal) or to remove it. When the pointer leaves the link,
 * the card lingers for a grace period so it can be reached without being
 * dismissed mid-travel; hovering the card keeps it open.
 *
 * The card is portaled into the positioned `.editor-inner` wrapper (the same
 * target used by the table plugins), so its coordinates are computed relative to
 * that element and it scrolls together with the content.
 */
export const FloatingLinkEditorPlugin = (): React.JSX.Element | null => {
	const [editor] = useLexicalComposerContext();
	const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	// The link is "pinned" (kept open regardless of hover) once it is pressed.
	const pinnedRef = useRef(false);
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cardRef = useRef<HTMLDivElement | null>(null);
	// Element the card is shown for: a removed auto-link is a `<span>`, not matched by `a:hover`.
	const anchorRef = useRef<HTMLElement | null>(null);

	const clearHide = useCallback((): void => {
		if (hideTimer.current !== null) {
			clearTimeout(hideTimer.current);
			hideTimer.current = null;
		}
	}, []);

	// Mouse enter/leave events can miss a transition (the card overlays the
	// editor content), so before hiding we ask the browser directly whether the
	// pointer still sits on the card or on a link.
	const isPointerOnCardOrLink = useCallback((): boolean => {
		try {
			return (
				cardRef.current?.matches(':hover') === true ||
				anchorRef.current?.matches(':hover') === true ||
				editor.getRootElement()?.querySelector('a:hover') != null
			);
		} catch {
			// Selector engines without hover tracking (e.g. jsdom): fall back to
			// the enter/leave events alone.
			return false;
		}
	}, [editor]);

	const scheduleHide = useCallback((): void => {
		clearHide();
		const arm = (): void => {
			hideTimer.current = setTimeout(() => {
				hideTimer.current = null;
				if (pinnedRef.current) {
					return;
				}
				if (isPointerOnCardOrLink()) {
					// The pointer is actually still on the card or on a link (the
					// enter event was missed): keep the card and check again later.
					arm();
					return;
				}
				anchorRef.current = null;
				setLinkInfo(null);
			}, HIDE_DELAY_MS);
		};
		arm();
	}, [clearHide, isPointerOnCardOrLink]);

	// Reads the link node behind `target` and positions the card just below its
	// element, relative to the positioned `.editor-inner` wrapper. The element is
	// resolved from the node, since a removed auto-link is a `<span>`, not an `<a>`.
	// Returns whether the target is inside a link.
	const showForTarget = useCallback(
		(target: EventTarget | null): boolean => {
			const innerElement = editor.getRootElement()?.parentElement ?? null;
			if (!(target instanceof HTMLElement) || !innerElement || !editor.isEditable()) {
				return false;
			}
			// `editor.read` sets the active editor required by `$getNearestNodeFromDOMNode`.
			return editor.read(() => {
				const node = $getNearestNodeFromDOMNode(target);
				const linkNode = $isLinkNode(node) ? node : node && $findMatchingParent(node, $isLinkNode);
				const anchor = $isLinkNode(linkNode) ? editor.getElementByKey(linkNode.getKey()) : null;
				if (!$isLinkNode(linkNode) || !anchor) {
					return false;
				}
				anchorRef.current = anchor;
				const rect = anchor.getBoundingClientRect();
				const innerRect = innerElement.getBoundingClientRect();
				setLinkInfo({
					url: linkNode.getURL(),
					// The URL may come from someone else's message: never link an unsafe scheme.
					href: linkNode.sanitizeUrl(linkNode.getURL()),
					key: linkNode.getKey(),
					unlinked: $isAutoLinkNode(linkNode) && linkNode.getIsUnlinked(),
					top: rect.bottom - innerRect.top + 4,
					left: rect.left - innerRect.left
				});
				return true;
			});
		},
		[editor]
	);

	const onMouseOver = useCallback(
		(event: MouseEvent): void => {
			if (showForTarget(event.target)) {
				clearHide();
			} else if (!pinnedRef.current) {
				scheduleHide();
			}
		},
		[clearHide, scheduleHide, showForTarget]
	);

	const onMouseDown = useCallback(
		(event: MouseEvent): void => {
			if (showForTarget(event.target)) {
				pinnedRef.current = true;
				clearHide();
			} else {
				// A press anywhere else dismisses the card.
				pinnedRef.current = false;
				anchorRef.current = null;
				clearHide();
				setLinkInfo(null);
			}
		},
		[clearHide, showForTarget]
	);

	const onMouseLeave = useCallback((): void => {
		if (!pinnedRef.current) {
			scheduleHide();
		}
	}, [scheduleHide]);

	useEffect(
		() =>
			editor.registerRootListener((rootElement, prevRootElement) => {
				prevRootElement?.removeEventListener('mouseover', onMouseOver);
				prevRootElement?.removeEventListener('mousedown', onMouseDown);
				prevRootElement?.removeEventListener('mouseleave', onMouseLeave);
				rootElement?.addEventListener('mouseover', onMouseOver);
				rootElement?.addEventListener('mousedown', onMouseDown);
				rootElement?.addEventListener('mouseleave', onMouseLeave);
			}),
		[editor, onMouseDown, onMouseLeave, onMouseOver]
	);

	useEffect(() => clearHide, [clearHide]);

	const dismiss = useCallback((): void => {
		pinnedRef.current = false;
		anchorRef.current = null;
		clearHide();
		setLinkInfo(null);
	}, [clearHide]);

	// Selects the link so the modal opens in edit mode (pre-filled from the node).
	// The update is discrete so the selection is committed before the modal reads it.
	const openEdit = useCallback((): void => {
		const key = linkInfo?.key;
		if (key !== undefined) {
			editor.update(
				() => {
					const node = $getNodeByKey(key);
					if ($isLinkNode(node)) {
						node.selectStart();
					}
				},
				{ discrete: true }
			);
		}
		setEditOpen(true);
	}, [editor, linkInfo]);

	const removeLink = useCallback((): void => {
		const key = linkInfo?.key;
		if (key !== undefined) {
			editor.update(() => {
				const node = $getNodeByKey(key);
				if ($isLinkNode(node)) {
					$removeLink(node);
				}
			});
		}
		dismiss();
	}, [dismiss, editor, linkInfo]);

	// Turns a removed auto-link back into a link when it holds plain text alone and
	// that text is one whole link, the checks the auto-link plugin makes on its text
	// edits (keeping the URL in sync with the text). The plugin never runs them on a
	// node without direct text, such as one wrapping another link loaded from
	// someone else's HTML: that one is unwrapped instead.
	const restoreLink = useCallback((): void => {
		const key = linkInfo?.key;
		if (key !== undefined) {
			editor.update(() => {
				const node = $getNodeByKey(key);
				if (!$isAutoLinkNode(node)) {
					return;
				}
				const plainText = node
					.getChildren()
					.every((child) => $isTextNode(child) && child.isSimpleText());
				if (plainText && matchWholeAutoLink(node.getTextContent())) {
					node.setIsUnlinked(false);
				} else {
					$unwrapNode(node);
				}
			});
		}
		dismiss();
	}, [dismiss, editor, linkInfo]);

	const innerElement = editor.getRootElement()?.parentElement ?? null;

	return (
		<>
			{linkInfo !== null &&
				innerElement !== null &&
				!editOpen &&
				createPortal(
					<FloatingLinkCard
						ref={cardRef}
						width="fit"
						height="fit"
						mainAlignment="flex-start"
						gap="0.25rem"
						padding={{ vertical: 'extrasmall', horizontal: 'small' }}
						style={{ top: linkInfo.top, left: linkInfo.left }}
						onMouseEnter={clearHide}
						onMouseLeave={onMouseLeave}
						// Keep the editor selection while interacting with the card.
						onMouseDown={(event: React.MouseEvent): void => event.preventDefault()}
					>
						{linkInfo.unlinked ? (
							<Button
								icon="Link2Outline"
								type="ghost"
								size="small"
								color="text"
								aria-label={t('lexical-label.restore_link', 'Restore link')}
								onClick={restoreLink}
							/>
						) : (
							<>
								<UrlLink
									href={linkInfo.href}
									target="_blank"
									rel="noopener noreferrer"
									size="small"
								>
									{linkInfo.url}
								</UrlLink>
								<Button
									icon="Edit2Outline"
									type="ghost"
									size="small"
									color="text"
									aria-label={t('lexical-label.edit_link', 'Edit link')}
									onClick={openEdit}
								/>
								<Button
									icon="Trash2Outline"
									type="ghost"
									size="small"
									color="text"
									aria-label={t('lexical-label.remove_link', 'Remove link')}
									onClick={removeLink}
								/>
							</>
						)}
					</FloatingLinkCard>,
					innerElement
				)}
			<LinkModal
				editor={editor}
				open={editOpen}
				onClose={(): void => {
					setEditOpen(false);
					dismiss();
				}}
			/>
		</>
	);
};
