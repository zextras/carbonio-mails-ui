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
	const [isOpen, setIsOpen] = useState(expanded || isAlone);
	const [isCollapsedDueToUnread, setIsCollapsedDueToUnread] = useState(false);
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const prevReadStatusRef = useRef<boolean | undefined>(message?.read);

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
		// Reset collapse flag when user manually toggles
		setIsCollapsedDueToUnread(false);
	}, []);

	const isMailPreviewOpen = useMemo(() => {
		// If collapsed due to marking as unread, stay collapsed even if isAlone is true
		if (isCollapsedDueToUnread) {
			return false;
		}
		return isMessageView || isAlone || isOpen;
	}, [isMessageView, isAlone, isOpen, isCollapsedDueToUnread]);

	useEffect(() => {
		const wasRead = prevReadStatusRef.current;
		const isNowUnread = message?.read === false;

		// If the message was previously read and is now unread, collapse the preview
		// Only skip collapsing in message view mode (where navigation happens instead)
		if (wasRead === true && isNowUnread && !isMessageView) {
			setIsOpen(false);
			setIsCollapsedDueToUnread(true);
		} else if (
			isMailPreviewOpen &&
			message?.isComplete &&
			isNowUnread &&
			prefMarkMsgRead &&
			!isEml &&
			wasRead !== true
		) {
			// If the preview is open and message is unread and complete, mark as read
			// BUT only if the message wasn't just marked as unread (transition from read to unread)
			setAsRead.execute();
		}

		prevReadStatusRef.current = message?.read;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isMailPreviewOpen,
		message?.isComplete,
		message?.read,
		message?.id,
		prefMarkMsgRead,
		isEml,
		isMessageView,
		isAlone
	]);

	// Reset collapse flag when message changes
	useEffect(() => {
		setIsCollapsedDueToUnread(false);
	}, [message?.id]);

	return (
		<Container
			height={containerHeight}
			data-testid={`MailPreview-${message.id}`}
			padding={isFocusModeMailView() ? { all: 'large' } : undefined}
			background="white"
		>
			<MailPreviewBlock
				onClick={onClick}
				message={message}
				open={isMailPreviewOpen}
				isEml={isEml}
			/>

			<Container
				width="fill"
				height="fit"
				style={{
					flex: '1',
					overflow: 'auto'
				}}
			>
				{isMailPreviewOpen && (
					<MailPreviewContent
						message={message}
						isMailPreviewOpen={isMailPreviewOpen}
						isEml={isEml}
					/>
				)}
			</Container>
		</Container>
	);
};

MailPreview.displayName = 'MailPreview';

export default MailPreview;
