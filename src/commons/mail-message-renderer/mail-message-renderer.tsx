/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo } from 'react';

import { EmptyBody } from './empty-body';
import { HtmlMessageRenderer } from './html-message-renderer';
import { TextMessageRenderer } from './text-message-renderer';
import type { MailMessagePart, Participant } from '../../types';

type MailMessageRendererProps = {
	parts: MailMessagePart[];
	body?: { content: string; contentType: string };
	id: string;
	fragment?: string;
	participants?: Participant[];
	isInsideExtraWindow?: boolean;
	showingEml?: boolean;
};

export const MailMessageRenderer: FC<MailMessageRendererProps> = memo(function MailMessageRenderer({
	parts,
	body,
	id,
	fragment,
	participants,
	isInsideExtraWindow = false,
	showingEml = false
}) {
	if (!body?.content?.length && !fragment) {
		return <EmptyBody />;
	}

	if (body?.contentType === 'text/html') {
		return (
			<HtmlMessageRenderer
				msgId={id}
				body={body}
				parts={parts}
				participants={participants}
				isInsideExtraWindow={isInsideExtraWindow}
				showingEml={showingEml}
			/>
		);
	}
	if (body?.contentType === 'text/plain') {
		return <TextMessageRenderer body={body} />;
	}
	return <EmptyBody />;
});
