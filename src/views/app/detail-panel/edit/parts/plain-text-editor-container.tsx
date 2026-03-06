/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import { useEditorSetDirty } from '../../../../../store/editor/hooks/statuses';
import { plainTextToHTML } from 'commons/utils';
import { useEditorText, useEditorTextProvider } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';

export const SAVE_EDITOR_DELAY = 2000;

export const PlainTextEditorContainer = ({
	editorId
}: {
	editorId: MailsEditorV2['id'];
}): JSX.Element => {
	const { getText, setText } = useEditorText(editorId);
	const { prefs } = useUserSettings();
	const { setTextProvider } = useEditorTextProvider(editorId);
	const { setDirty } = useEditorSetDirty(editorId);
	const text = useMemo(() => getText().plainText, [getText]);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const initialValueRef = useRef(text);
	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;

	const getCurrentText = useCallback((): MailsEditorV2['text'] | null => {
		if (!textAreaRef.current) {
			return null;
		}

		const plainText = textAreaRef.current.value;
		const richText = plainTextToHTML(plainText);

		return { plainText, richText };
	}, []);

	const onExternalTextChanges = useCallback(
		(value: MailsEditorV2['text']): void => {
			if (!textAreaRef.current) {
				return;
			}
			setDirty();
			textAreaRef.current.value = value.plainText;
		},
		[setDirty]
	);

	const debounceSetText = useMemo(
		() =>
			debounce((ev: ChangeEvent<HTMLTextAreaElement>): void => {
				setText(
					{ plainText: ev.target.value, richText: plainTextToHTML(ev.target.value) },
					{ syncTextProvider: false }
				);
			}, SAVE_EDITOR_DELAY),
		[setText]
	);

	const onTextChange = useCallback(
		(ev: ChangeEvent<HTMLTextAreaElement>): void => {
			setDirty();
			debounceSetText(ev);
		},
		[debounceSetText, setDirty]
	);

	const textProviderValue = useMemo(
		() => ({
			setCurrentText: onExternalTextChanges,
			getCurrentText
		}),
		[getCurrentText, onExternalTextChanges]
	);

	useEffect(() => {
		setTextProvider(textProviderValue);
		const textArea = textAreaRef?.current;
		const initialValue = initialValueRef?.current;
		return (): void => {
			if (textArea && initialValue && textArea.value !== initialValue) {
				setText(
					{
						plainText: textArea.value,
						richText: plainTextToHTML(textArea.value)
					},
					{ syncTextProvider: false }
				);
			}
			setTextProvider(undefined);
		};
	}, [setText, setTextProvider, textProviderValue]);

	return (
		<Container data-testid={'PlainTextEditorContainer'} background={'gray6'} height="100%">
			<StyledComp.TextArea
				data-testid="MailPlainTextEditor"
				ref={textAreaRef}
				defaultValue={initialValueRef.current}
				style={{ fontFamily: defaultFontFamily, outline: 'none' }}
				onFocus={(ev): void => {
					ev.currentTarget.setSelectionRange(0, null);
				}}
				onChange={onTextChange}
			/>
		</Container>
	);
};
