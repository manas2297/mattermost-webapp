// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {Client4} from 'mattermost-redux/client';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import store from 'stores/redux_store.jsx';

import * as UserAgent from 'utils/user_agent';

import Suggestion from './suggestion.jsx';
import Provider from './provider.jsx';

export class CommandSuggestion extends Suggestion {
    render() {
        const {item, isSelection} = this.props;

        let className = 'slash-command';
        if (isSelection) {
            className += ' suggestion--selected';
        }
        let icon = <div className='slash-command__icon'><span>{'/'}</span></div>;
        if (item.iconData !== '') {
            icon = (
                <div
                    className='slash-command__icon'
                    style={{backgroundColor: 'transparent'}}
                >
                    <img src={item.iconData}/>
                </div>);
        }

        return (
            <div
                className={className}
                onClick={this.handleClick}
                onMouseMove={this.handleMouseMove}
                {...Suggestion.baseProps}
            >
                {icon}
                <div className='slash-command__info'>
                    <div className='slash-command__title'>
                        {item.suggestion.substring(1) + ' ' + item.hint}
                    </div>
                    <div className='slash-command__desc'>
                        {item.description}
                    </div>
                </div>
            </div>
        );
    }
}

export default class CommandProvider extends Provider {
    handlePretextChanged(pretext, resultCallback) {
        if (!pretext.startsWith('/')) {
            return false;
        }
        if (UserAgent.isMobile()) {
            return this.handleMobile(pretext, resultCallback);
        }
        return this.handleWebapp(pretext, resultCallback);
    }

    handleCompleteWord(term, pretext, callback) {
        callback(term + ' ');
    }

    handleMobile(pretext, resultCallback) {
        const command = pretext.toLowerCase();
        Client4.getCommandsList(getCurrentTeamId(store.getState())).then(
            (data) => {
                let matches = [];
                data.forEach((cmd) => {
                    if (!cmd.auto_complete) {
                        return;
                    }

                    if (cmd.trigger !== 'shortcuts') {
                        if (('/' + cmd.trigger).indexOf(command) === 0) {
                            const s = '/' + cmd.trigger;
                            let hint = '';
                            if (cmd.auto_complete_hint && cmd.auto_complete_hint.length !== 0) {
                                hint = cmd.auto_complete_hint;
                            }
                            matches.push({
                                suggestion: s,
                                hint,
                                description: cmd.auto_complete_desc,
                            });
                        }
                    }
                });

                matches = matches.sort((a, b) => a.suggestion.localeCompare(b.suggestion));

                // pull out the suggested commands from the returned data
                const terms = matches.map((suggestion) => suggestion.suggestion);

                resultCallback({
                    matchedPretext: command,
                    terms,
                    items: matches,
                    component: CommandSuggestion,
                });
            }
        ).catch(
            () => {} //eslint-disable-line no-empty-function
        );

        return true;
    }

    handleWebapp(pretext, resultCallback) {
        const command = pretext.toLowerCase();
        Client4.getCommandAutocompleteSuggestionsList(command, getCurrentTeamId(store.getState())).then(
            (data) => {
                const matches = [];
                data.forEach((sug) => {
                    matches.push({
                        complete: '/' + sug.Complete,
                        suggestion: '/' + sug.Suggestion,
                        hint: sug.Hint,
                        description: sug.Description,
                        iconData: sug.IconData,
                    });
                });

                // pull out the suggested commands from the returned data
                const terms = matches.map((suggestion) => suggestion.complete);

                resultCallback({
                    matchedPretext: command,
                    terms,
                    items: matches,
                    component: CommandSuggestion,
                });
            }
        ).catch(
            () => {} //eslint-disable-line no-empty-function
        );

        return true;
    }
}
