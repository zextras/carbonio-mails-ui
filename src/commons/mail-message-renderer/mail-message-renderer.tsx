/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, memo } from 'react';

import { EmptyBody } from './empty-body';
import { HtmlMessageRenderer } from './html-message-renderer';
import { TextMessageRenderer } from './text-message-renderer';
import type { BodyPart } from '../../types';

type MailMessageRendererProps = {
	body?: BodyPart;
	id: string;
	fragment?: string;
};

export const MailMessageRenderer: FC<MailMessageRendererProps> = memo(function MailMessageRenderer({
	body,
	id,
	fragment
}) {
	if (!body?.content?.length && !fragment) {
		return <EmptyBody />;
	}

	if (body?.contentType === 'text/html') {
		return <HtmlMessageRenderer msgId={id} />;
	}
	if (body?.contentType === 'text/plain') {
		return <TextMessageRenderer body={body} />;
	}
	return <EmptyBody />;
});
