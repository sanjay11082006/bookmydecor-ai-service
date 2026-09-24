for f in ['.env', '.env.example']:
    print(f"--- {f} ---")
    with open(f, 'r') as fh:
        for i, line in enumerate(fh.readlines(), 1):
            s = line.strip()
            if s and '=' in s:
                k, v = s.split('=', 1)
                if 'KEY' in k or 'TOKEN' in k:
                    print(f"  Line {i}: {k}= [length={len(v)}]")
                else:
                    print(f"  Line {i}: {s}")
