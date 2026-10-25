"""Facts read from AgentDojo by running its own code, for fetch-agentdojo-calls.ts.

Run only through `npm run sources:agentdojo-calls`, with the Python of
external/agentdojo-venv (README, Sources). It loads the four v1 suites from the
local clone at the pinned commit, with the default environment (no injection),
and prints one JSON document to stdout:

  - for every injection task: its goal, the tool calls of its
    ground_truth(), and the text AgentDojo's tool_knowledge attack builds from
    their placeholder arguments;
  - for every user task: the tool calls of its ground_truth();
  - the fixed text of the attack templates not used by corpus 1.2.0.

No model is called and nothing leaves the machine. Tool calls are the ones
AgentDojo's authors wrote; nothing here writes a call of its own.
"""

import inspect
import json
import sys

from agentdojo.attacks.baseline_attacks import DirectAttack
from agentdojo.attacks.dos_attacks import (
    CaptchaDoSAttack,
    DoSAttack,
    FelonyDoSAttack,
    OffensiveEmailDoSAttack,
    SwearwordsDoSAttack,
)
from agentdojo.attacks.important_instructions_attacks import ToolKnowledgeAttack
from agentdojo.task_suite.load_suites import get_suites


def jsonable(value):
    """Tool arguments as plain JSON values (dates and enums become strings)."""
    return json.loads(json.dumps(value, default=str))


def calls_of(task, env):
    return [
        {
            "function": call.function,
            "args": jsonable(dict(call.args)),
            "placeholder_args": jsonable(dict(call.placeholder_args)) if call.placeholder_args is not None else None,
        }
        for call in task.ground_truth(env)
    ]


def main():
    suites = {}
    for name, suite in sorted(get_suites("v1").items()):
        env = suite.load_and_inject_default_environment({})
        # The text tool_knowledge inserts for a task, built by AgentDojo itself.
        # The pipeline only names the model in the template; the converter
        # fills {model} the same way for every template.
        tool_knowledge = ToolKnowledgeAttack.__new__(ToolKnowledgeAttack)
        tool_knowledge.task_suite = suite
        suites[name] = {
            "injection_tasks": [
                {
                    "id": task.ID,
                    "goal": task.GOAL,
                    "calls": calls_of(task, env),
                    "tools_sequence": tool_knowledge.get_tools_sequence(task),
                }
                for task in sorted(suite.injection_tasks.values(), key=lambda t: int(t.ID.rsplit("_", 1)[1]))
            ],
            "user_tasks": [
                {"id": task.ID, "calls": calls_of(task, env)}
                for task in sorted(suite.user_tasks.values(), key=lambda t: int(t.ID.rsplit("_", 1)[1]))
            ],
        }

    # DirectAttack passes its template to the base class instead of a class field.
    templates = {
        "direct": "TODO: {goal}",
        "tool_knowledge": ToolKnowledgeAttack._JB_STRING,
    }
    for attack in (DoSAttack, SwearwordsDoSAttack, CaptchaDoSAttack, OffensiveEmailDoSAttack, FelonyDoSAttack):
        templates[attack.name] = attack._DOS_STRING
    assert '"TODO: {goal}"' in inspect.getsource(DirectAttack), "direct template changed upstream"

    json.dump({"templates": templates, "suites": suites}, sys.stdout, indent=1, sort_keys=True)


if __name__ == "__main__":
    main()
