/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { plainTextToHTML } from 'commons/utils';
import { useEditorText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';

export const PlainTextEditorContainer = ({
	editorId
}: {
	editorId: MailsEditorV2['id'];
}): JSX.Element => {
	const { text, setText } = useEditorText(editorId);
	const { prefs } = useUserSettings();
	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;

	const onChange = useCallback(
		(ev: ChangeEvent<HTMLTextAreaElement>): void => {
			setText({
				plainText: ev.target.value,
				richText: plainTextToHTML(ev.target.value)
			});
		},
		[setText]
	);

	return (
		<Container data-testid={'PlainTextEditorContainer'} background={'gray6'} height="100%">
			<StyledComp.TextArea
				data-testid="MailPlainTextEditor"
				value={text.plainText}
				style={{ fontFamily: defaultFontFamily, outline: 'none' }}
				onFocus={(ev): void => {
					ev.currentTarget.setSelectionRange(0, null);
				}}
				onChange={onChange}
			/>
		</Container>
	);
};
