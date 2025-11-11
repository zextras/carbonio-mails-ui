/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { isFocusModeMailView } from 'helpers/external-tabs';
import { useMsgSetReadFn } from 'hooks/actions/use-msg-set-read';
import type { MailMessage } from 'types/index.d';
import { MailPreviewBlock } from 'views/app/detail-panel/preview/parts/mail-preview-block';
import { MailPreviewContent } from 'views/app/detail-panel/preview/parts/mail-preview-content';

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	isAlone: boolean;
	isMessageView: boolean;
	isEml?: boolean;
};

const MailPreview: FC<MailPreviewProps> = ({
	message,
	expanded,
	isAlone,
	isMessageView,
	isEml = false
}) => {
	// Local state for tracking whether the preview is open
	const [isOpen, setIsOpen] = useState(expanded || isAlone);

	// Track the previous read status to detect state transitions
	const prevReadStatusRef = useRef<boolean | undefined>(message?.read);
	// Track if we just marked a message as unread to prevent auto-read race condition
	const justMarkedUnreadRef = useRef<boolean>(false);

	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const setAsRead = useMsgSetReadFn({
		ids: message?.id ? [message.id] : [],
		folderId: message?.parent ?? '',
		isMessageRead: false
	});

	const containerHeight = useMemo(() => {
		if (isOpen) {
			return '100%';
		}
		return 'fit-content';
	}, [isOpen]);

	const onClick = useCallback(() => {
		setIsOpen((prevOpen) => !prevOpen);
	}, []);

	// Effect 1: When message transitions from read to unread, collapse the preview
	useEffect(() => {
		const wasRead = prevReadStatusRef.current;
		const isNowUnread = message?.read === false;

		if (wasRead === true && isNowUnread) {
			setIsOpen(false);
			justMarkedUnreadRef.current = true;
		}

		prevReadStatusRef.current = message?.read;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [message?.read, message?.id]);

	// Effect 2: When preview is opened and message is unread, auto-mark as read
	// Skip auto-mark only if message was just transitioned to unread
	useEffect(() => {
		const shouldSkipAutoRead = justMarkedUnreadRef.current;

		if (
			isOpen &&
			message?.isComplete &&
			message?.read === false &&
			prefMarkMsgRead &&
			!isEml &&
			!shouldSkipAutoRead
		) {
			setAsRead.execute();
		}

		// Reset the flag only when we've opened the preview and skipped auto-read
		// This ensures the flag doesn't interfere with subsequent opens
		if (isOpen && justMarkedUnreadRef.current) {
			justMarkedUnreadRef.current = false;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, message?.isComplete, message?.read, message?.id, prefMarkMsgRead, isEml]);

	// Effect 3: When expanded prop changes from parent, update isOpen
	// Also collapse the message when navigating away
	useEffect(() => {
		setIsOpen(expanded || isAlone);
		// Reset the flag when message changes
		justMarkedUnreadRef.current = false;
		// Collapse when navigating away from the message
		return () => {
			setIsOpen(false);
		};
	}, [expanded, isAlone, message.id]);

	// Effect 4: In message view, always keep preview open
	useEffect(() => {
		if (isMessageView) {
			setIsOpen(true);
		}
	}, [isMessageView]);

	return (
		<Container
			height={containerHeight}
			data-testid={`MailPreview-${message.id}`}
			padding={isFocusModeMailView() ? { all: 'large' } : undefined}
			background="white"
		>
			<MailPreviewBlock onClick={onClick} message={message} open={isOpen} isEml={isEml} />

			<Container
				width="fill"
				height="fit"
				style={{
					flex: '1',
					overflow: 'auto'
				}}
			>
				{isOpen && (
					<MailPreviewContent message={message} isMailPreviewOpen={isOpen} isEml={isEml} />
				)}
			</Container>
		</Container>
	);
};

MailPreview.displayName = 'MailPreview';

export default MailPreview;
