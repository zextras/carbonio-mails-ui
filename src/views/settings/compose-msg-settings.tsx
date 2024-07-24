/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, FormSubSection, RadioGroup, Radio } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import Heading from './components/settings-heading';
import { getFontSizesOptions, findLabel, getFonts } from './components/utils';
import CustomSelect from './filters/parts/custom-select';
import { composingMsgSubSection } from './subsections';
import { ColorPicker } from '../../commons/color-picker';
import { map } from 'lodash';

type UpdateSettingsProps = {
	target: {
		name: string;
		value: string;
	};
};

type ComposeMessagesProps = {
	settingsObj: Record<string, string>;
	updateSettings: (arg: UpdateSettingsProps) => void;
};

const ComposeMessage: FC<ComposeMessagesProps> = ({ settingsObj, updateSettings }) => {
	const [color, setColor] = useState(
		settingsObj?.zimbraPrefHtmlEditorDefaultFontColor ?? '#aabbcc'
	);

	const sectionTitle = useMemo(() => composingMsgSubSection(), []);
	const fontSizesOptions = useMemo(() => getFontSizesOptions(), []);
	const fontsOptions = useMemo(() => getFonts(), []);

	const fontSizesOptionsArray = map(fontSizesOptions, (value) => ({
		label: value,
		value
	}));

	console.log('fontSizesOptionsArray: ', fontSizesOptionsArray);

	const onColorChange = useCallback(
		(value) => {
			setColor(value);
			updateSettings({ target: { name: 'zimbraPrefHtmlEditorDefaultFontColor', value } });
		},
		[updateSettings]
	);

	// TODO: DEFINE WHAT TO DO WITHT THOSE VALUES FALLBACKS
	const defaultSelectionFontSize = useMemo(
		() => ({
			label: settingsObj.zimbraPrefHtmlEditorDefaultFontSize,
			value: settingsObj.zimbraPrefHtmlEditorDefaultFontSize
		}),
		[settingsObj.zimbraPrefHtmlEditorDefaultFontSize]
	);

	const defaultSelectionFont = useMemo(
		() => ({
			label: findLabel(fontsOptions, settingsObj.zimbraPrefHtmlEditorDefaultFontFamily),
			value: settingsObj.zimbraPrefHtmlEditorDefaultFontFamily
		}),
		[fontsOptions, settingsObj.zimbraPrefHtmlEditorDefaultFontFamily]
	);
	const isDisabled = useMemo(
		() => settingsObj?.zimbraPrefComposeFormat === 'text',
		[settingsObj?.zimbraPrefComposeFormat]
	);
	return (
		<FormSubSection id={sectionTitle.id} label={sectionTitle.label} padding={{ all: 'medium' }}>
			<Container
				crossAlignment="baseline"
				padding={{ horizontal: 'small', bottom: 'small', top: 'medium' }}
			>
				<Container orientation="horizontal" crossAlignment="flex-start" mainAlignment="flex-start">
					<Container
						width="fit"
						orientation="horizontal"
						crossAlignment="flex-start"
						mainAlignment="flex-start"
					>
						<Heading title={t('labels.compose_colin', 'Compose :')} size="small" />{' '}
						<RadioGroup
							style={{ width: '100%' }}
							value={settingsObj?.zimbraPrefComposeFormat}
							onChange={(newValue): void => {
								updateSettings({
									target: { name: 'zimbraPrefComposeFormat', value: newValue as string }
								});
							}}
						>
							<Radio width="100%" label={t('label.as_html', 'As HTML')} value="html" />
							<Radio width="100%" label={t('label.as_text', 'As Text')} value="text" />
						</RadioGroup>
					</Container>
					<Container
						orientation="horizontal"
						crossAlignment="flex-start"
						mainAlignment="space-between"
						padding={{ left: 'medium' }}
						maxWidth="40vw"
					>
						<Container padding={{ right: 'small' }} minWidth="5.9375rem">
							<CustomSelect
								items={fontsOptions}
								background="gray5"
								disabled={isDisabled}
								label={t('settings.font', 'Font')}
								onChange={(value: string): void =>
									updateSettings({
										target: { name: 'zimbraPrefHtmlEditorDefaultFontFamily', value }
									})
								}
								defaultSelection={defaultSelectionFont}
							/>
						</Container>

						<Container padding={{ right: 'small' }} minWidth="6.25rem">
							<CustomSelect
								items={fontSizesOptionsArray}
								background="gray5"
								label={t('label.size', 'Size')}
								defaultSelection={defaultSelectionFontSize}
								disabled={isDisabled}
								onChange={(size: string): void =>
									updateSettings({
										target: { name: 'zimbraPrefHtmlEditorDefaultFontSize', value: size }
									})
								}
							/>
						</Container>
						<Container padding={{ right: 'small' }} crossAlignment="flex-start">
							<ColorPicker color={color} onChange={onColorChange} disabled={isDisabled} />
						</Container>
					</Container>
				</Container>
			</Container>
		</FormSubSection>
	);
};

export default ComposeMessage;
