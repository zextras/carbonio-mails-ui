/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

export const EmlPreviewPanelContainer = (): React.JSX.Element => {
	const { folderId, messageId, part } = useParams() as {
		folderId: string;
		messageId: string;
		part: string;
	};

	return <EmlPreviewPanel messageId={messageId} folderId={folderId} part={part} />;
};
